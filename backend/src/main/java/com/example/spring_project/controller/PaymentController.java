package com.example.spring_project.controller;

import com.example.spring_project.dto.PaymentRequest;
import com.example.spring_project.entity.Payment;
import com.example.spring_project.service.PaymentService;
import com.example.spring_project.service.PayOSService;
import com.example.spring_project.entity.Booking;
import com.example.spring_project.repository.BookingRepository;
import com.example.spring_project.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import vn.payos.PayOS;
import vn.payos.model.webhooks.WebhookData;
import vn.payos.model.webhooks.Webhook;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class PaymentController {

    private final PaymentService paymentService;
    private final PayOSService payOSService;
    private final PayOS payOS;
    private final EmailService emailService;
    private final BookingRepository bookingRepository;

    @PostMapping
    public ResponseEntity<Payment> createPayment(@RequestBody PaymentRequest request) {
        Payment payment = paymentService.processPayment(request);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/payos-payment")
    public ResponseEntity<String> createPayOsPayment(@RequestParam("amount") int amount,
            @RequestParam("orderInfo") String orderInfo) {

        int bookingId = -1;
        try {
            // e.g. "VNPAY BK-5" -> 5
            bookingId = Integer.parseInt(orderInfo.replaceAll("\\D", ""));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid booking info");
        }

        String returnUrl = "http://localhost:3000/payment/payos-return";
        String cancelUrl = "http://localhost:3000/payment/payos-cancel";

        String paymentUrl = payOSService.createPaymentLink(bookingId, amount, returnUrl, cancelUrl);
        return ResponseEntity.ok(paymentUrl);
    }

    @PostMapping("/payos-webhook")
    public ResponseEntity<?> handlePayOsWebhook(@RequestBody com.fasterxml.jackson.databind.JsonNode webhookBodyNode) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Webhook webhookBody = mapper.treeToValue(webhookBodyNode, Webhook.class);
            WebhookData data = payOS.webhooks().verify(webhookBody);

            if ("00".equals(data.getCode())) {
                long orderCode = data.getOrderCode();
                int bookingId = (int) (orderCode / 100000); // Extract booking ID from the 5-digit padded order code

                Booking booking = bookingRepository.findById(bookingId).orElse(null);
                if (booking != null) {
                    double amountPaid = data.getAmount();

                    PaymentRequest pr = new PaymentRequest();
                    pr.setInvoiceId(bookingId);
                    pr.setAmount(BigDecimal.valueOf(amountPaid));
                    pr.setMethod(com.example.spring_project.entity.PaymentMethod.PaymentGateway);

                    paymentService.processPayment(pr);
                    emailService.sendPaymentSuccessEmail(booking, amountPaid);

                    return ResponseEntity.ok("Success");
                }
            }
            return ResponseEntity.ok("Webhook processed but ignored");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook verification failed");
        }
    }
}
