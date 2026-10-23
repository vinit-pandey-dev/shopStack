package com.example.ecommerce.payment;

import com.example.ecommerce.dto.request.PlaceOrderRequest;
import com.example.ecommerce.entity.PaymentMethod;

import java.math.BigDecimal;

/**
 * Abstraction over a payment provider. The order flow only talks to this
 * interface, so swapping the mock for Razorpay / Stripe means writing one new
 * @Component that implements it - no change to OrderServiceImpl.
 */
public interface PaymentGateway {
    PaymentResult charge(PaymentMethod method, BigDecimal amount, PlaceOrderRequest request);
}
