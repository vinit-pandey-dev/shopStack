package com.example.ecommerce.payment;

import com.example.ecommerce.dto.request.PlaceOrderRequest;
import com.example.ecommerce.entity.PaymentMethod;

import java.math.BigDecimal;


public interface PaymentGateway {
    PaymentResult charge(PaymentMethod method, BigDecimal amount, PlaceOrderRequest request);
}
