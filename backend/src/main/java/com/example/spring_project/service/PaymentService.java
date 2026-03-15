package com.example.spring_project.service;

import com.example.spring_project.dto.PaymentRequest;
import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.Invoice;
import com.example.spring_project.entity.Payment;
import com.example.spring_project.entity.PaymentStatus;
import com.example.spring_project.repository.BookingRepository;
import com.example.spring_project.repository.InvoiceRepository;
import com.example.spring_project.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public Payment processPayment(PaymentRequest request) {
        // 1. Find or Create Invoice
        // The frontend might pass bookingId as invoiceId if invoice is not yet created.
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseGet(() -> {
                    // Try to find by bookingId
                    List<Invoice> existingInvoices = invoiceRepository.findByBookingId(request.getInvoiceId());
                    if (!existingInvoices.isEmpty()) {
                        return existingInvoices.get(0);
                    }

                    // If not found, create new invoice from Booking
                    com.example.spring_project.entity.Booking booking = bookingRepository
                            .findById(request.getInvoiceId())
                            .orElseThrow(() -> new RuntimeException(
                                    "Invoice or Booking not found with id: " + request.getInvoiceId()));

                    Invoice newInvoice = new Invoice();
                    newInvoice.setBookingId(booking.getBookingId());
                    newInvoice.setTotalAmount(BigDecimal.valueOf(booking.getTotalPrice()));
                    newInvoice.setAmountDue(BigDecimal.valueOf(booking.getTotalPrice()));
                    newInvoice.setStatus("Pending");
                    newInvoice.setUpdatedAt(java.time.LocalDateTime.now());
                    return invoiceRepository.save(newInvoice);
                });

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
