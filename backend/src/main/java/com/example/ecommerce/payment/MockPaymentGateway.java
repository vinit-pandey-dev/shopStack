package com.example.ecommerce.payment;

import com.example.ecommerce.dto.request.PlaceOrderRequest;
import com.example.ecommerce.entity.PaymentMethod;
import com.example.ecommerce.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Simulated gateway for demos - no real money moves.
 *
 * Test cards:   4242 4242 4242 4242 -> approved
 *               4000 0000 0000 0002 -> declined (card declined)
 *               4000 0000 0000 9995 -> declined (insufficient funds)
 *               any other Luhn-valid 13-19 digit number -> approved
 * Test UPI:     anything like name@bank -> approved; "fail@..." -> declined
 * COD:          always accepted (payment stays PENDING until delivery)
 */
@Component
public class MockPaymentGateway implements PaymentGateway {

    private static final Pattern UPI_PATTERN = Pattern.compile("^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$");

    @Override
    public PaymentResult charge(PaymentMethod method, BigDecimal amount, PlaceOrderRequest request) {
        return switch (method) {
            case COD -> PaymentResult.approved(newTransactionId("COD"), "Cash on delivery");
            case CARD -> chargeCard(request.getCardNumber());
            case UPI -> chargeUpi(request.getUpiId());
        };
    }

    private PaymentResult chargeCard(String rawNumber) {
        String digits = rawNumber == null ? "" : rawNumber.replaceAll("\\D", "");
        if (digits.length() < 13 || digits.length() > 19 || !passesLuhn(digits)) {
            throw new BadRequestException("Invalid card number");
        }
        if (digits.equals("4000000000000002")) {
            return PaymentResult.declined("Your card was declined by the issuing bank");
        }
        if (digits.equals("4000000000009995")) {
            return PaymentResult.declined("Your card has insufficient funds");
        }
        String masked = "Card ending in " + digits.substring(digits.length() - 4);
        return PaymentResult.approved(newTransactionId("TXN"), masked);
    }

    private PaymentResult chargeUpi(String upiId) {
        if (upiId == null || !UPI_PATTERN.matcher(upiId.trim()).matches()) {
            throw new BadRequestException("Invalid UPI ID (expected something like name@bank)");
        }
        String id = upiId.trim();
        if (id.toLowerCase().startsWith("fail")) {
            return PaymentResult.declined("UPI payment request was declined");
        }
        String masked = "UPI " + id.charAt(0) + "***" + id.substring(id.indexOf('@'));
        return PaymentResult.approved(newTransactionId("UPI"), masked);
    }

    private boolean passesLuhn(String digits) {
        int sum = 0;
        boolean doubleIt = false;
        for (int i = digits.length() - 1; i >= 0; i--) {
            int n = digits.charAt(i) - '0';
            if (doubleIt) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            doubleIt = !doubleIt;
        }
        return sum % 10 == 0;
    }

    private String newTransactionId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }
}
