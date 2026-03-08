package com.example.spring_project.service;

import com.example.spring_project.dto.PaymentRequest;
import com.example.spring_project.entity.Invoice;
import com.example.spring_project.entity.Payment;
import com.example.spring_project.entity.PaymentStatus;
import com.example.spring_project.repository.InvoiceRepository;
import com.example.spring_project.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional
    public Payment processPayment(PaymentRequest request) {
        // 1. Find Invoice
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + request.getInvoiceId()));

        // 2. Create Payment
        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setAmount(request.getAmount());
        payment.setMethod(request.getMethod());
        payment.setBankName(request.getBankName());
        payment.setBankAccount(request.getBankAccount());

        // 3. Set Status based on Method
        switch (request.getMethod()) {
            case Cash:
                payment.setStatus(PaymentStatus.Completed);
                break;
            case PaymentGateway:
                // Logic to call Gateway would go here
                // For now, assume it's pending until callback
                payment.setStatus(PaymentStatus.Pending);
                break;
            default:
                payment.setStatus(PaymentStatus.Pending);
        }

        Payment savedPayment = paymentRepository.save(payment);

        // 4. Update Invoice Amount Due if Completed
        if (savedPayment.getStatus() == PaymentStatus.Completed) {
            BigDecimal newAmountDue = invoice.getAmountDue().subtract(request.getAmount());
            if (newAmountDue.compareTo(BigDecimal.ZERO) < 0) {
                newAmountDue = BigDecimal.ZERO;
            }
            invoice.setAmountDue(newAmountDue);

            // Update Invoice Status
            if (newAmountDue.compareTo(BigDecimal.ZERO) == 0) {
                invoice.setStatus("Fully Paid");
            } else {
                invoice.setStatus("Partially Paid");
            }
            invoiceRepository.save(invoice);
        }

        return savedPayment;
    }
}
