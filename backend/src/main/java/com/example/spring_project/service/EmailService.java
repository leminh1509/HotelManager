package com.example.spring_project.service;

import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.Room;
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

    // ════════════════════════════════════════════════════════════════════════════
    // ✅ MỚI: Gửi OTP xác thực đăng ký
    // ════════════════════════════════════════════════════════════════════════════
    @Async
    public void sendRegisterOtpEmail(String toEmail, String firstName, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Mã xác thực đăng ký tài khoản - Hotel Management");
            helper.setText(buildRegisterOtpTemplate(firstName, otp), true);

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Không thể gửi OTP đến: " + toEmail);
            e.printStackTrace();
        }
    }

    private String buildRegisterOtpTemplate(String firstName, String otp) {
        return "<!DOCTYPE html>" +
                "<html><head><meta charset='UTF-8'></head>" +
                "<body style='margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center' style='padding:40px 20px;'>" +
                "<table width='520' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;" +
                "box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;'>" +

                // Header
                "<tr><td style='background:linear-gradient(135deg,#6c63ff,#4facfe);padding:36px;text-align:center;'>" +
                "<h1 style='color:#ffffff;margin:0;font-size:26px;letter-spacing:1px;'>🏨 Hotel Management</h1>" +
                "<p style='color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;'>Hệ thống quản lý khách sạn</p>" +
                "</td></tr>" +

                // Body
                "<tr><td style='padding:40px 36px;'>" +
                "<p style='font-size:16px;color:#2d3748;margin:0 0 12px;'>Xin chào <strong>" + firstName + "</strong>,</p>" +
                "<p style='font-size:14px;color:#718096;margin:0 0 28px;line-height:1.6;'>" +
                "Bạn đã yêu cầu đăng ký tài khoản tại <strong>Hotel Management System</strong>. " +
                "Vui lòng sử dụng mã OTP dưới đây để hoàn tất đăng ký:</p>" +

                // OTP box
                "<div style='text-align:center;margin:32px 0;'>" +
                "<div style='display:inline-block;background:#f0f0ff;border:2px dashed #6c63ff;" +
                "border-radius:12px;padding:20px 48px;'>" +
                "<span style='font-size:42px;font-weight:900;letter-spacing:12px;color:#6c63ff;" +
                "font-family:monospace;'>" + otp + "</span>" +
                "</div>" +
                "<p style='color:#a0aec0;font-size:13px;margin:14px 0 0;'>⏱ Mã có hiệu lực trong <strong>10 phút</strong></p>" +
                "</div>" +

                "<div style='background:#fff8f0;border-left:4px solid #f6ad55;border-radius:4px;" +
                "padding:14px 18px;margin:24px 0;'>" +
                "<p style='color:#744210;font-size:13px;margin:0;'>" +
                "⚠️ <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã này cho bất kỳ ai. " +
                "Nhân viên khách sạn sẽ không bao giờ hỏi mã OTP của bạn." +
                "</p></div>" +

                "<p style='font-size:13px;color:#718096;margin:0;line-height:1.6;'>" +
                "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này." +
                "</p></td></tr>" +

                // Footer
                "<tr><td style='background:#f7fafc;padding:20px 36px;text-align:center;" +
                "border-top:1px solid #e2e8f0;'>" +
                "<p style='color:#a0aec0;font-size:12px;margin:0;'>" +
                "© 2025 Hotel Management System · Email này được gửi tự động, vui lòng không trả lời." +
                "</p></td></tr>" +

                "</table></td></tr></table>" +
                "</body></html>";
    }

    // ════════════════════════════════════════════════════════════════════════════
    // GỬI EMAIL THANH TOÁN THÀNH CÔNG (giữ nguyên từ trước)
    // ════════════════════════════════════════════════════════════════════════════
    @Async
    public void sendPaymentSuccessEmail(Booking booking, double amountPaid) {
        if (booking.getGuestEmail() == null || booking.getGuestEmail().isEmpty()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(booking.getGuestEmail());
            helper.setSubject("Xác nhận thanh toán thành công - Mã đặt phòng: " + booking.getBookingId());
            helper.setText(buildPaymentEmailTemplate(booking, amountPaid), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send email to: " + booking.getGuestEmail());
            e.printStackTrace();
        }
    }

    private String buildPaymentEmailTemplate(Booking booking, double amountPaid) {
        Room room = booking.getRoom();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String checkin  = booking.getCheckinTime()  != null ? booking.getCheckinTime().format(formatter)  : "N/A";
        String checkout = booking.getCheckoutTime() != null ? booking.getCheckoutTime().format(formatter) : "N/A";
        NumberFormat cf = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));

        return "<html><body style='font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;'>" +
                "<div style='background-color:#f8f9fa;padding:20px;border-radius:8px;border:1px solid #e9ecef;'>" +
                "<div style='text-align:center;margin-bottom:20px;'>" +
                "<h2 style='color:#28a745;margin:0;'>Thanh toán thành công!</h2>" +
                "<p style='color:#6c757d;font-size:14px;'>Cảm ơn bạn đã đặt phòng tại Khách sạn của chúng tôi.</p></div>" +
                "<table style='width:100%;border-collapse:collapse;margin-bottom:20px;'>" +
                "<tr><td style='padding:8px 0;border-bottom:1px solid #dee2e6;'><strong>Mã Đặt Phòng:</strong></td>" +
                "    <td style='padding:8px 0;text-align:right;border-bottom:1px solid #dee2e6;'><strong>" + booking.getBookingId() + "</strong></td></tr>" +
                "<tr><td style='padding:8px 0;border-bottom:1px solid #dee2e6;'><strong>Khách hàng:</strong></td>" +
                "    <td style='padding:8px 0;text-align:right;border-bottom:1px solid #dee2e6;'>" + booking.getGuestName() + "</td></tr>" +
                "<tr><td style='padding:8px 0;border-bottom:1px solid #dee2e6;'><strong>Phòng:</strong></td>" +
                "    <td style='padding:8px 0;text-align:right;border-bottom:1px solid #dee2e6;'>" + room.getRoomNumber() + " - " + room.getCategory().getName() + "</td></tr>" +
                "<tr><td style='padding:8px 0;border-bottom:1px solid #dee2e6;'><strong>Check-in:</strong></td>" +
                "    <td style='padding:8px 0;text-align:right;border-bottom:1px solid #dee2e6;'>" + checkin + "</td></tr>" +
                "<tr><td style='padding:8px 0;border-bottom:1px solid #dee2e6;'><strong>Check-out:</strong></td>" +
                "    <td style='padding:8px 0;text-align:right;border-bottom:1px solid #dee2e6;'>" + checkout + "</td></tr>" +
                "<tr><td style='padding:8px 0;border-bottom:1px solid #dee2e6;'><strong>Tổng tiền phòng:</strong></td>" +
                "    <td style='padding:8px 0;text-align:right;border-bottom:1px solid #dee2e6;'>" + cf.format(booking.getTotalPrice()) + "</td></tr>" +
                "<tr><td style='padding:8px 0;'><strong>Đã thanh toán:</strong></td>" +
                "    <td style='padding:8px 0;text-align:right;color:#28a745;'><strong>" + cf.format(amountPaid) + "</strong></td></tr>" +
                "</table>" +
                "<p style='font-size:14px;'>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>" +
                "<p style='font-size:14px;margin-top:30px;text-align:center;color:#6c757d;'>Trân trọng,<br>Ban Quản Lý Khách Sạn</p>" +
                "</div></body></html>";
    }
}