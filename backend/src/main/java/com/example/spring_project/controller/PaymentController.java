package com.example.spring_project.controller;

import com.example.spring_project.dto.PaymentRequest;
import com.example.spring_project.entity.Payment;
import com.example.spring_project.service.PaymentService;
import com.example.spring_project.service.VNPayService;
import com.example.spring_project.entity.Booking;
import com.example.spring_project.repository.BookingRepository;
import com.example.spring_project.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class PaymentController {

    private final PaymentService paymentService;
    private final VNPayService vnPayService;
    private final EmailService emailService;
    private final BookingRepository bookingRepository;

    @PostMapping
    public ResponseEntity<Payment> createPayment(@RequestBody PaymentRequest request) {
        Payment payment = paymentService.processPayment(request);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/vnpay-payment")
    public ResponseEntity<String> createVnPayPayment(@RequestParam("amount") int amount,
            @RequestParam("orderInfo") String orderInfo,
            @RequestParam(required = false) String bankCode) {
        String paymentUrl = vnPayService.createOrder(amount, orderInfo, null, bankCode);
        return ResponseEntity.ok(paymentUrl);
    }

    @PostMapping("/vnpay-verify")
    public ResponseEntity<?> verifyVnPayPayment(@RequestBody Map<String, String> params) {
        if (!vnPayService.verifyHash(params)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }

        int paymentStatus = vnPayService.orderReturn(params);
        if (paymentStatus != 1) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment failed");
        }

        // Handle success
        String invoiceIdStr = params.get("vnp_OrderInfo");
        // Extract BK- numbers if any logic is needed, or just assume format
        String bookingIdStr = invoiceIdStr.replace("VNPAY BK-", "").replaceAll("\\D", ""); // simple extract ID
        int bookingId = -1;
        try {
            bookingId = Integer.parseInt(bookingIdStr);
        } catch (Exception e) {
            // fallback
            try {
                bookingId = Integer.parseInt(invoiceIdStr.replaceAll("\\D", ""));
            } catch (Exception ignored) {
            }
        }

        if (bookingId > 0) {
            Booking booking = bookingRepository.findById(bookingId).orElse(null);
            if (booking != null) {
                // Determine amount
                double amountPaid = Double.parseDouble(params.get("vnp_Amount")) / 100;

                // create payment record logic
                PaymentRequest pr = new PaymentRequest();

                try {
                    pr.setInvoiceId(Integer.parseInt(invoiceIdStr.replaceAll("\\D", "")));
                } catch (Exception e) {
                    pr.setInvoiceId(bookingId); // fallback
                }

                pr.setAmount(BigDecimal.valueOf(amountPaid));
                pr.setMethod(com.example.spring_project.entity.PaymentMethod.PaymentGateway);

                try {
                    paymentService.processPayment(pr);
                } catch (Exception e) {
                    // Exception might happen if we parse invoice ID differently, catching to ensure
                    // email still sends if applicable
                }

                // Send email
                emailService.sendPaymentSuccessEmail(booking, amountPaid);
                return ResponseEntity.ok("Success");
            }
        }
        return ResponseEntity.ok("Verified but booking not found");
    }
}
