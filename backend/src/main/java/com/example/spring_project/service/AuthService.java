package com.example.spring_project.service;

import com.example.spring_project.dto.AuthResponse;
import com.example.spring_project.dto.LoginRequest;
import com.example.spring_project.dto.RegisterRequest;
import com.example.spring_project.entity.Role;
import com.example.spring_project.entity.User;
import com.example.spring_project.repository.RoleRepository;
import com.example.spring_project.repository.UserRepository;
import com.example.spring_project.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository        userRepository;
    private final RoleRepository        roleRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtUtil               jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService          emailService;
    private final OtpStore              otpStore;       // ← inject OtpStore

    // Validate → sinh OTP → lưu tạm → gửi email
    // POST /api/auth/register  →  trả { message: "OTP đã gửi..." }

    public void sendRegisterOtp(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được đăng ký");
        }
        if (request.getMobilePhone() != null
                && !request.getMobilePhone().isBlank()
                && userRepository.existsByMobilePhone(request.getMobilePhone())) {
            throw new RuntimeException("Số điện thoại đã được đăng ký");
        }

        String otp = generateOtp();

        otpStore.savePending(request.getEmail(), request);
        otpStore.saveOtp(request.getEmail(), otp);

        // Gửi email OTP (async)
        emailService.sendRegisterOtpEmail(request.getEmail(), request.getFirstName(), otp);

        // Debug log — xóa sau khi test xong
        System.out.println("[OTP] sendRegisterOtp"
                + " | email=" + request.getEmail().toLowerCase().trim()
                + " | otp=" + otp
                + " | otpStore.instance=" + otpStore.hashCode());
    }

    // Xác thực OTP → tạo User trong DB → trả JWT
    // POST /api/auth/verify-register-otp  →  trả AuthResponse + token
    @Transactional
    public AuthResponse verifyRegisterOtp(String email, String otp) {
        // Debug log
        OtpStore.OtpEntry stored = otpStore.getOtpEntry(email);
        System.out.println("[OTP] verifyRegisterOtp"
                + " | email=" + email.toLowerCase().trim()
                + " | input=" + otp.trim()
                + " | stored=" + (stored != null ? stored.getCode() : "NULL")
                + " | expired=" + (stored != null ? stored.isExpired() : "N/A")
                + " | hasPending=" + otpStore.hasPending(email)
                + " | otpStore.instance=" + otpStore.hashCode());

        if (!otpStore.isOtpValid(email, otp)) {
            if (stored == null) {
                throw new RuntimeException("OTP không tồn tại. Vui lòng yêu cầu lại.");
            } else if (stored.isExpired()) {
                otpStore.clear(email);
                throw new RuntimeException("OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
            } else {
                throw new RuntimeException("Mã OTP không đúng. Vui lòng kiểm tra lại.");
            }
        }

        RegisterRequest request = otpStore.getPending(email);
        if (request == null) {
            throw new RuntimeException("Không tìm thấy phiên đăng ký. Vui lòng điền lại thông tin.");
        }

        // Kiểm tra lại email chưa bị đăng ký bởi người khác trong lúc chờ
        if (userRepository.existsByEmail(request.getEmail())) {
            otpStore.clear(email);
            throw new RuntimeException("Email đã được đăng ký. Vui lòng đăng nhập.");
        }

        Role customerRole = roleRepository.findByName("customer")
                .orElseThrow(() -> new RuntimeException("Không tìm thấy role customer"));

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setMiddleName(request.getMiddleName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setMobilePhone(request.getMobilePhone());
        user.setBirthday(request.getBirthday());
        user.setRole(customerRole);
        user.setIsActive(true);
        user.setIsBlackList(false);

        User savedUser = userRepository.save(user);

        // Dọn dẹp OTP + pending
        otpStore.clear(email);

        String token = jwtUtil.generateToken(savedUser);
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(savedUser.getUserId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .role(savedUser.getRole().getName())
                .message("Đăng ký thành công")
                .build();
    }

    // GỬI LẠI OTP
    // POST /api/auth/resend-otp
    public void resendRegisterOtp(String email) {
        if (!otpStore.hasPending(email)) {
            throw new RuntimeException("Không tìm thấy phiên đăng ký. Vui lòng điền lại thông tin.");
        }

        RegisterRequest request = otpStore.getPending(email);
        String otp = generateOtp();
        otpStore.saveOtp(email, otp);
        emailService.sendRegisterOtpEmail(email, request.getFirstName(), otp);

        System.out.println("[OTP] resendRegisterOtp | email=" + email.toLowerCase().trim() + " | otp=" + otp);
    }

    // LOGIN
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new RuntimeException("Email hoặc mật khẩu không đúng");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        if (!user.getIsActive())   throw new RuntimeException("Tài khoản chưa được kích hoạt");
        if (user.getIsBlackList()) throw new RuntimeException("Tài khoản đã bị khóa");

        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().getName())
                .message("Đăng nhập thành công")
                .build();
    }
    private String generateOtp() {
        return String.valueOf(100_000 + new SecureRandom().nextInt(900_000));
    }
}