package com.example.spring_project.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PayOSService {

    private final PayOS payOS;

    public String createPaymentLink(int bookingId, int totalAmount, String returnUrl, String cancelUrl) {
        try {
            // orderCode = bookingId * 100000 + (timestamp % 100000)
            long orderCode = Long.parseLong(
                    String.format("%d%05d", bookingId, System.currentTimeMillis() % 100000));

            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name("Booking " + bookingId)
                    .quantity(1)
                    .price((long) totalAmount)
                    .build();

            CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount((long) totalAmount)
                    .description("Pay Booking " + bookingId)
                    .returnUrl(returnUrl)
                    .cancelUrl(cancelUrl)
                    .items(List.of(item))
                    .build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(request);
            return response.getCheckoutUrl();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error creating PayOS payment link", e);
        }
    }
}
