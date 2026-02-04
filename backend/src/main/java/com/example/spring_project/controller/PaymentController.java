package com.example.spring_project.controller;

import com.example.spring_project.dto.PaymentRequest;
import com.example.spring_project.entity.Payment;
import com.example.spring_project.service.PaymentService;
import com.example.spring_project.service.VNPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class PaymentController {

    private final PaymentService paymentService;
    private final VNPayService vnPayService;

    @PostMapping
    public ResponseEntity<Payment> createPayment(@RequestBody PaymentRequest request) {
        Payment payment = paymentService.processPayment(request);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/vnpay-payment")
    public ResponseEntity<String> createVnPayPayment(@RequestParam("amount") int amount,
            @RequestParam("orderInfo") String orderInfo) {
        String paymentUrl = vnPayService.createOrder(amount, orderInfo, null);
        return ResponseEntity.ok(paymentUrl);
    }
}
