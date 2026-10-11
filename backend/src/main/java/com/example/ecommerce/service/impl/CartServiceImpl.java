package com.example.ecommerce.service.impl;

import com.example.ecommerce.dto.request.AddToCartRequest;
import com.example.ecommerce.dto.request.UpdateCartItemRequest;
import com.example.ecommerce.dto.response.CartItemDto;
import com.example.ecommerce.entity.CartItem;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.BadRequestException;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.CartItemRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    public List<CartItemDto> getCart(String username) {
        User user = getUser(username);
        return cartItemRepository.findByUserId(user.getId()).stream().map(this::toDto).toList();
    }

    @Override
    public CartItemDto addToCart(String username, AddToCartRequest request) {
        User user = getUser(username);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.getProductId()));

        if (product.getStock() < request.getQuantity()) {
            throw new BadRequestException("Not enough stock for " + product.getName());
        }

        CartItem item = cartItemRepository.findByUserIdAndProductId(user.getId(), product.getId())
                .map(existing -> {
                    existing.setQuantity(existing.getQuantity() + request.getQuantity());
                    return existing;
                })
                .orElseGet(() -> CartItem.builder()
                        .user(user)
                        .product(product)
                        .quantity(request.getQuantity())
                        .build());

        return toDto(cartItemRepository.save(item));
    }

    @Override
    public CartItemDto updateCartItem(String username, Long itemId, UpdateCartItemRequest request) {
        User user = getUser(username);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + itemId));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("This cart item does not belong to you");
        }

        item.setQuantity(request.getQuantity());
        return toDto(cartItemRepository.save(item));
    }

    @Override
    public void removeFromCart(String username, Long itemId) {
        User user = getUser(username);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + itemId));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("This cart item does not belong to you");
        }

        cartItemRepository.delete(item);
    }

    @Override
    public void clearCart(String username) {
        User user = getUser(username);
        cartItemRepository.deleteByUserId(user.getId());
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private CartItemDto toDto(CartItem item) {
        return new CartItemDto(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getProduct().getPrice(),
                item.getQuantity(),
                item.getProduct().getPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())),
                item.getProduct().getImageUrl()
        );
    }
}
