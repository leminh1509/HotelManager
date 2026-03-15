package com.example.spring_project.controller;

import com.example.spring_project.dto.AuthResponse;
import com.example.spring_project.dto.ErrorResponse;
import com.example.spring_project.dto.Googleauthrequest;
import com.example.spring_project.dto.LoginRequest;
import com.example.spring_project.dto.RegisterRequest;
import com.example.spring_project.service.AuthService;
import com.example.spring_project.service.Googleauthservice;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
public class AuthController {

    private final AuthService     authService;
    private final Googleauthservice googleAuthService;

    // ════════════════════════════════════════════════════════════════════════════
    // BƯỚC 1: Nhận thông tin đăng ký → backend sinh OTP → gửi email
    // Frontend nhận 200 OK → chuyển sang màn nhập OTP
    // ════════════════════════════════════════════════════════════════════════════
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.sendRegisterOtp(request);
            Map<String, String> body = new HashMap<>();
            body.put("message", "Mã OTP đã được gửi đến " + request.getEmail() + ". Vui lòng kiểm tra hộp thư.");
            return ResponseEntity.ok(body);
        } catch (RuntimeException e) {
            return buildError(HttpStatus.BAD_REQUEST, "Đăng ký thất bại", e.getMessage(), null);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // BƯỚC 2: Xác thực OTP → tạo tài khoản → trả JWT
    // ════════════════════════════════════════════════════════════════════════════
    @PostMapping("/verify-register-otp")
    public ResponseEntity<?> verifyRegisterOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            AuthResponse response = authService.verifyRegisterOtp(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return buildError(HttpStatus.BAD_REQUEST, "Xác thực OTP thất bại", e.getMessage(), null);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // GỬI LẠI OTP (dùng cho cả Register và ForgotPassword nếu muốn)
    // ════════════════════════════════════════════════════════════════════════════
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        try {
            authService.resendRegisterOtp(request.getEmail());
            Map<String, String> body = new HashMap<>();
            body.put("message", "Mã OTP mới đã được gửi đến " + request.getEmail());
            return ResponseEntity.ok(body);
        } catch (RuntimeException e) {
            return buildError(HttpStatus.BAD_REQUEST, "Gửi lại OTP thất bại", e.getMessage(), null);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // LOGIN
    // ════════════════════════════════════════════════════════════════════════════
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return buildError(HttpStatus.UNAUTHORIZED, "Đăng nhập thất bại", e.getMessage(), null);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // GOOGLE LOGIN
    // ════════════════════════════════════════════════════════════════════════════
    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@Valid @RequestBody Googleauthrequest request) {
        try {
            AuthResponse response = googleAuthService.loginWithGoogle(request.getIdToken());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return buildError(HttpStatus.UNAUTHORIZED, "Google Authentication Failed", e.getMessage(), null);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // LOGOUT
    // ════════════════════════════════════════════════════════════════════════════
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đăng xuất thành công");
        return ResponseEntity.ok(response);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // Validation exception handler
    // ════════════════════════════════════════════════════════════════════════════
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> validationErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field   = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            validationErrors.put(field, message);
        });
        ErrorResponse err = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Failed")
                .message("Dữ liệu không hợp lệ")
                .path(request.getRequestURI())
                .validationErrors(validationErrors)
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // DTO nội bộ cho verify-otp và resend-otp
    // ════════════════════════════════════════════════════════════════════════════
    @Data
    public static class VerifyOtpRequest {
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        private String email;

        @NotBlank(message = "OTP không được để trống")
        private String otp;
    }

    @Data
    public static class ResendOtpRequest {
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        private String email;
    }

    // Helper
    private ResponseEntity<ErrorResponse> buildError(HttpStatus status, String error, String message, String path) {
        return ResponseEntity.status(status).body(
                ErrorResponse.builder()
                        .timestamp(LocalDateTime.now())
                        .status(status.value())
                        .error(error)
                        .message(message)
                        .path(path)
                        .build()
        );
    }
}