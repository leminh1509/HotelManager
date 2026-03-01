package com.example.spring_project.service;

import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.Room;
import com.example.spring_project.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendPaymentSuccessEmail(Booking booking, double amountPaid) {
        if (booking.getGuestEmail() == null || booking.getGuestEmail().isEmpty()) {
            return; // No email to send to
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(booking.getGuestEmail());
            helper.setSubject("Xác nhận thanh toán thành công - Mã đặt phòng: " + booking.getBookingId());

            String htmlContent = buildEmailTemplate(booking, amountPaid);
            helper.setText(htmlContent, true); // true indicates HTML

            mailSender.send(message);

        } catch (MessagingException e) {
            // Log the error but don't fail the transaction
            System.err.println("Failed to send email to: " + booking.getGuestEmail());
            e.printStackTrace();
        }
    }

    private String buildEmailTemplate(Booking booking, double amountPaid) {
        Room room = booking.getRoom();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String checkin = booking.getCheckinTime() != null ? booking.getCheckinTime().format(formatter) : "N/A";
        String checkout = booking.getCheckoutTime() != null ? booking.getCheckoutTime().format(formatter) : "N/A";

        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
        String formattedTotal = currencyFormat.format(booking.getTotalPrice());
        String formattedPaid = currencyFormat.format(amountPaid);

        return "<html>" +
                "<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;'>"
                +
                "<div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;'>"
                +
                "<div style='text-align: center; margin-bottom: 20px;'>" +
                "  <h2 style='color: #28a745; margin: 0;'>Thanh toán thành công!</h2>" +
                "  <p style='color: #6c757d; font-size: 14px;'>Cảm ơn bạn đã đặt phòng tại Khách sạn của chúng tôi.</p>"
                +
                "</div>" +
                "<table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>" +
                "  <tr><td style='padding: 8px 0; border-bottom: 1px solid #dee2e6;'><strong>Mã Đặt Phòng:</strong></td>"
                +
                "      <td style='padding: 8px 0; text-align: right; border-bottom: 1px solid #dee2e6;'><strong>"
                + booking.getBookingId() + "</strong></td></tr>" +
                "  <tr><td style='padding: 8px 0; border-bottom: 1px solid #dee2e6;'><strong>Khách hàng:</strong></td>"
                +
                "      <td style='padding: 8px 0; text-align: right; border-bottom: 1px solid #dee2e6;'>"
                + booking.getGuestName() + "</td></tr>" +
                "  <tr><td style='padding: 8px 0; border-bottom: 1px solid #dee2e6;'><strong>Phòng:</strong></td>" +
                "      <td style='padding: 8px 0; text-align: right; border-bottom: 1px solid #dee2e6;'>"
                + room.getRoomNumber() + " - " + room.getCategory().getName() + "</td></tr>" +
                "  <tr><td style='padding: 8px 0; border-bottom: 1px solid #dee2e6;'><strong>Check-in:</strong></td>" +
                "      <td style='padding: 8px 0; text-align: right; border-bottom: 1px solid #dee2e6;'>" + checkin
                + "</td></tr>" +
                "  <tr><td style='padding: 8px 0; border-bottom: 1px solid #dee2e6;'><strong>Check-out:</strong></td>" +
                "      <td style='padding: 8px 0; text-align: right; border-bottom: 1px solid #dee2e6;'>" + checkout
                + "</td></tr>" +
                "  <tr><td style='padding: 8px 0; border-bottom: 1px solid #dee2e6;'><strong>Tổng tiền phòng:</strong></td>"
                +
                "      <td style='padding: 8px 0; text-align: right; border-bottom: 1px solid #dee2e6;'>"
                + formattedTotal + "</td></tr>" +
                "  <tr><td style='padding: 8px 0;'><strong>Đã thanh toán:</strong></td>" +
                "      <td style='padding: 8px 0; text-align: right; color: #28a745;'><strong>" + formattedPaid
                + "</strong></td></tr>" +
                "</table>" +
                "<p style='font-size: 14px;'>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>" +
                "<p style='font-size: 14px; margin-top: 30px; text-align: center; color: #6c757d;'>Trân trọng,<br>Ban Quản Lý Khách Sạn</p>"
                +
                "</div>" +
                "</body>" +
                "</html>";
    }
}
