package com.example.ecommerce.payment;

public record PaymentResult(boolean success, String transactionId, String maskedInstrument, String failureReason) {

    public static PaymentResult approved(String transactionId, String maskedInstrument) {
        return new PaymentResult(true, transactionId, maskedInstrument, null);
    }

    public static PaymentResult declined(String reason) {
        return new PaymentResult(false, null, null, reason);
    }
}
