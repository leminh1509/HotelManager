package com.example.spring_project.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
@Data
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Integer paymentId;

    @ManyToOne
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @Column(name = "transaction_time")
    private LocalDateTime transactionTime;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "bank_account")
    private String bankAccount;

    @PrePersist
    protected void onCreate() {
        if (transactionTime == null) {
            transactionTime = LocalDateTime.now();
        }
    }
}
