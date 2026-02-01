package com.example.spring_project.dto;

import com.example.spring_project.entity.PaymentMethod;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequest {
    private Integer invoiceId;
    private BigDecimal amount;
    private PaymentMethod method; // CASH, BANK_TRANSFER, PAYMENT_GATEWAY

    // Optional details for transfer
    private String bankName;
    private String bankAccount;

    // Optional details for gateway (if needed, e.g. token)
    private String paymentToken;
}
