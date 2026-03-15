package com.example.spring_project.service;

import com.example.spring_project.entity.OtpToken;
import com.example.spring_project.entity.User;
import com.example.spring_project.repository.OtpTokenRepository;
import com.example.spring_project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    @Value("${otp.expiration.minutes:5}")
    private int otpExpirationMinutes;

    @Transactional
    public void sendOtp(String email) {
        // Kiểm tra email tồn tại
        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống"));

        // Xóa OTP cũ
        otpTokenRepository.deleteAllByEmail(email);

        // Tạo OTP 6 số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Lưu OTP vào DB
        OtpToken otpToken = new OtpToken(
                email,
                otp,
                LocalDateTime.now().plusMinutes(otpExpirationMinutes)
        );
        otpTokenRepository.save(otpToken);

        // Gửi email
        sendOtpEmail(email, otp);
    }

    public void verifyOtp(String email, String otp) {
        OtpToken token = otpTokenRepository.findTopByEmailOrderByExpiresAtDesc(email)
                .orElseThrow(() -> new RuntimeException("OTP không tồn tại. Vui lòng yêu cầu lại."));

        if (token.isUsed()) {
            throw new RuntimeException("OTP đã được sử dụng.");
        }
        if (token.isExpired()) {
            throw new RuntimeException("OTP đã hết hạn. Vui lòng yêu cầu lại.");
        }
        if (!token.getOtp().equals(otp)) {
            throw new RuntimeException("OTP không chính xác.");
        }
    }

    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        // Xác thực OTP lần cuối
        OtpToken token = otpTokenRepository.findTopByEmailOrderByExpiresAtDesc(email)
                .orElseThrow(() -> new RuntimeException("OTP không hợp lệ."));

        if (token.isUsed() || token.isExpired() || !token.getOtp().equals(otp)) {
            throw new RuntimeException("OTP không hợp lệ hoặc đã hết hạn.");
        }

        // Đổi mật khẩu
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Đánh dấu OTP đã dùng
        token.setUsed(true);
        otpTokenRepository.save(token);
    }

    private void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("🔐 Mã OTP đặt lại mật khẩu - Hotel Management");
        message.setText(
                "Xin chào,\n\n" +
                        "Bạn đã yêu cầu đặt lại mật khẩu.\n\n" +
                        "Mã OTP của bạn là: " + otp + "\n\n" +
                        "Mã có hiệu lực trong " + otpExpirationMinutes + " phút.\n" +
                        "Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.\n\n" +
                        "Trân trọng,\nHotel Management System"
        );
        mailSender.send(message);
    }
}