package com.example.ecommerce.entity;

public enum PaymentStatus {
    PENDING,   // e.g. cash on delivery - collected when the order arrives
    SUCCESS,
    FAILED,
    REFUNDED
}
