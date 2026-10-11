package com.example.ecommerce.service.impl;

import com.example.ecommerce.dto.request.PlaceOrderRequest;
import com.example.ecommerce.dto.response.OrderDto;
import com.example.ecommerce.dto.response.OrderItemDto;
import com.example.ecommerce.entity.*;
import com.example.ecommerce.exception.BadRequestException;
import com.example.ecommerce.exception.PaymentFailedException;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.payment.PaymentGateway;
import com.example.ecommerce.payment.PaymentResult;
import com.example.ecommerce.repository.CartItemRepository;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.service.NotificationService;
import com.example.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PaymentGateway paymentGateway;
    private final NotificationService notificationService;

    /**
     * Checkout: reserve stock -> charge payment -> save order -> clear cart -> notify.
     * Everything runs in ONE transaction: if the payment is declined (or anything else
     * throws), stock changes, the order and the notifications are all rolled back and
     * the cart is left untouched.
     */
    @Override
    @Transactional
    public OrderDto placeOrder(String username, PlaceOrderRequest request) {
        User user = getUser(username);
        List<CartItem> cartItems = cartItemRepository.findByUserId(user.getId());

        if (cartItems.isEmpty()) {
            throw new BadRequestException("Your cart is empty");
        }

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .shippingAddress(request.getShippingAddress())
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();

            if (product.getStock() < cartItem.getQuantity()) {
                throw new BadRequestException("Not enough stock for " + product.getName());
            }

            product.setStock(product.getStock() - cartItem.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .priceAtPurchase(product.getPrice())
                    .build();

            order.getItems().add(orderItem);
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        order.setTotalAmount(total);

        // ---- payment ----
        PaymentResult result = paymentGateway.charge(request.getPaymentMethod(), total, request);
        if (!result.success()) {
            throw new PaymentFailedException(result.failureReason());   // -> rollback
        }

        boolean cod = request.getPaymentMethod() == PaymentMethod.COD;
        Payment payment = Payment.builder()
                .order(order)
                .method(request.getPaymentMethod())
                .status(cod ? PaymentStatus.PENDING : PaymentStatus.SUCCESS)
                .amount(total)
                .transactionId(result.transactionId())
                .maskedInstrument(result.maskedInstrument())
                .build();
        order.setPayment(payment);
        order.setStatus(OrderStatus.CONFIRMED);

        Order saved = orderRepository.save(order);   // cascades to order items + payment
        cartItemRepository.deleteByUserId(user.getId());

        // ---- notifications ----
        notificationService.send(user, NotificationType.ORDER_PLACED,
                "Order #" + saved.getId() + " has been placed and confirmed.", saved.getId());
        if (!cod) {
            notificationService.send(user, NotificationType.PAYMENT_SUCCESS,
                    "Payment of $" + total.setScale(2, RoundingMode.HALF_UP) + " received for order #" + saved.getId() + ".", saved.getId());
        }

        return toDto(saved);
    }

    @Override
    public List<OrderDto> getOrdersForUser(String username) {
        User user = getUser(username);
        return orderRepository.findByUserIdOrderByOrderDateDesc(user.getId()).stream().map(this::toDto).toList();
    }

    @Override
    public OrderDto getOrderById(String username, Long orderId) {
        User user = getUser(username);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("This order does not belong to you");
        }

        return toDto(order);
    }

    // ===================== admin =====================

    @Override
    public List<OrderDto> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc().stream().map(this::toDto).toList();
    }

    @Override
    @Transactional
    public OrderDto updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        OrderStatus current = order.getStatus();
        if (current == OrderStatus.DELIVERED || current == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order #" + orderId + " is already " + current.name().toLowerCase());
        }
        if (newStatus == current) {
            throw new BadRequestException("Order is already " + current.name().toLowerCase());
        }
        if (newStatus == OrderStatus.PENDING) {
            throw new BadRequestException("An order can't be moved back to pending");
        }

        order.setStatus(newStatus);
        Payment payment = order.getPayment();
        String message;

        switch (newStatus) {
            case SHIPPED -> message = "Good news! Your order #" + orderId + " has been shipped.";
            case DELIVERED -> {
                message = "Your order #" + orderId + " has been delivered. Enjoy!";
                // cash on delivery is collected at the door
                if (payment != null && payment.getStatus() == PaymentStatus.PENDING) {
                    payment.setStatus(PaymentStatus.SUCCESS);
                }
            }
            case CANCELLED -> {
                // put the stock back
                for (OrderItem item : order.getItems()) {
                    Product product = item.getProduct();
                    product.setStock(product.getStock() + item.getQuantity());
                    productRepository.save(product);
                }
                if (payment != null && payment.getStatus() == PaymentStatus.SUCCESS) {
                    payment.setStatus(PaymentStatus.REFUNDED);
                    message = "Your order #" + orderId + " was cancelled and your payment will be refunded.";
                } else {
                    message = "Your order #" + orderId + " was cancelled.";
                }
            }
            default -> message = "Your order #" + orderId + " is now " + newStatus.name().toLowerCase() + ".";
        }

        Order saved = orderRepository.save(order);
        notificationService.send(order.getUser(), NotificationType.ORDER_STATUS, message, orderId);
        return toDto(saved);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    /** Customer-initiated cancel: only your own order, and only before it ships. Reuses the admin cancel logic. */
    @Override
    @Transactional
    public OrderDto cancelOwnOrder(String username, Long orderId) {
        User user = getUser(username);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("This order does not belong to you");
        }
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BadRequestException("Order #" + orderId + " is already " + order.getStatus().name().toLowerCase()
                    + " and can no longer be cancelled online. Please contact support.");
        }
        return updateOrderStatus(orderId, OrderStatus.CANCELLED);
    }

    private OrderDto toDto(Order order) {
        List<OrderItemDto> items = order.getItems().stream()
                .map(oi -> new OrderItemDto(
                        oi.getProduct().getId(),
                        oi.getProduct().getName(),
                        oi.getQuantity(),
                        oi.getPriceAtPurchase()))
                .toList();

        Payment p = order.getPayment();

        return new OrderDto(
                order.getId(),
                order.getOrderDate(),
                order.getStatus().name(),
                order.getTotalAmount(),
                order.getShippingAddress(),
                order.getUser().getUsername(),
                p != null ? p.getMethod().name() : null,
                p != null ? p.getStatus().name() : null,
                p != null ? p.getTransactionId() : null,
                p != null ? p.getMaskedInstrument() : null,
                items
        );
    }
}
