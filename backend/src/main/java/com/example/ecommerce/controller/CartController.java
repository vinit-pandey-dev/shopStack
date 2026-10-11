package com.example.ecommerce.controller;

import com.example.ecommerce.dto.request.AddToCartRequest;
import com.example.ecommerce.dto.request.UpdateCartItemRequest;
import com.example.ecommerce.dto.response.CartItemDto;
import com.example.ecommerce.dto.response.MessageResponse;
import com.example.ecommerce.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<List<CartItemDto>> getCart(Authentication auth) {
        return ResponseEntity.ok(cartService.getCart(auth.getName()));
    }

    @PostMapping
    public ResponseEntity<CartItemDto> addToCart(Authentication auth, @Valid @RequestBody AddToCartRequest request) {
        return ResponseEntity.ok(cartService.addToCart(auth.getName(), request));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<CartItemDto> updateItem(Authentication auth, @PathVariable Long itemId,
                                                   @Valid @RequestBody UpdateCartItemRequest request) {
        return ResponseEntity.ok(cartService.updateCartItem(auth.getName(), itemId, request));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<MessageResponse> removeItem(Authentication auth, @PathVariable Long itemId) {
        cartService.removeFromCart(auth.getName(), itemId);
        return ResponseEntity.ok(new MessageResponse("Item removed from cart"));
    }

    @DeleteMapping
    public ResponseEntity<MessageResponse> clearCart(Authentication auth) {
        cartService.clearCart(auth.getName());
        return ResponseEntity.ok(new MessageResponse("Cart cleared"));
    }
}
