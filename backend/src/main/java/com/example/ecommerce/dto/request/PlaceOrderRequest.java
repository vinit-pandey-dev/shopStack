package com.example.ecommerce.dto.request;

import com.example.ecommerce.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.ToString;

@Data
public class PlaceOrderRequest {

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    // Only used by the MOCK gateway for test payments. Never stored, never logged.
    // In production you would not send card data to your own server at all
    // (Razorpay / Stripe tokenize it in the browser and you only receive a token).
    @ToString.Exclude
    private String cardNumber;

    private String upiId;
}
