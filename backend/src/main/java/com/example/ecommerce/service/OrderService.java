package com.example.ecommerce.service;

import com.example.ecommerce.dto.request.PlaceOrderRequest;
import com.example.ecommerce.dto.response.OrderDto;
import com.example.ecommerce.entity.OrderStatus;

import java.util.List;

public interface OrderService {
    OrderDto placeOrder(String username, PlaceOrderRequest request);
    List<OrderDto> getOrdersForUser(String username);
    OrderDto getOrderById(String username, Long orderId);
    OrderDto cancelOwnOrder(String username, Long orderId);

    // admin
    List<OrderDto> getAllOrders();
    OrderDto updateOrderStatus(Long orderId, OrderStatus newStatus);
}
