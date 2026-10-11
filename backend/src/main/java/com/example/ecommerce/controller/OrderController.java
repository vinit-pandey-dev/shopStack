package com.example.ecommerce.controller;

import com.example.ecommerce.dto.request.PlaceOrderRequest;
import com.example.ecommerce.dto.response.OrderDto;
import com.example.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderDto> placeOrder(Authentication auth, @Valid @RequestBody PlaceOrderRequest request) {
        return ResponseEntity.ok(orderService.placeOrder(auth.getName(), request));
    }

    @GetMapping
    public ResponseEntity<List<OrderDto>> getOrders(Authentication auth) {
        return ResponseEntity.ok(orderService.getOrdersForUser(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrder(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(auth.getName(), id));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<OrderDto> cancelOrder(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOwnOrder(auth.getName(), id));
    }
}
