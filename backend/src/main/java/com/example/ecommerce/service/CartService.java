package com.example.ecommerce.service;

import com.example.ecommerce.dto.request.AddToCartRequest;
import com.example.ecommerce.dto.request.UpdateCartItemRequest;
import com.example.ecommerce.dto.response.CartItemDto;

import java.util.List;

public interface CartService {
    List<CartItemDto> getCart(String username);
    CartItemDto addToCart(String username, AddToCartRequest request);
    CartItemDto updateCartItem(String username, Long itemId, UpdateCartItemRequest request);
    void removeFromCart(String username, Long itemId);
    void clearCart(String username);
}
