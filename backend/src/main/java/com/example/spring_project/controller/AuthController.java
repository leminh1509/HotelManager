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
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * AuthController - Xử lý các request liên quan đến xác thực
 * Đây là lớp Controller trong mô hình MVC, chịu trách nhiệm:
 * - Nhận HTTP request từ client (frontend/Postman)
 * - Validate dữ liệu đầu vào
 * - Gọi Service xử lý nghiệp vụ
 * - Trả về HTTP response phù hợp
 * Base URL: /api/auth
 */
@RestController   // Kết hợp @Controller + @ResponseBody: tự động chuyển return value thành JSON
@RequestMapping("/api/auth") // Tất cả endpoint trong class này đều bắt đầu bằng /api/auth
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
// CrossOrigin: cho phép frontend ở các địa chỉ này gọi API (CORS cấp controller)
public class AuthController {

    private final AuthService authService;           // Xử lý đăng ký/đăng nhập thường
    private final Googleauthservice googleAuthService; // Xử lý đăng nhập Google

    /**
     * POST /api/auth/register
     * Đăng ký tài khoản mới
     * @Valid: tự động kiểm tra các annotation trong RegisterRequest (NotBlank, Email, ...)
     * Nếu validation lỗi -> ném MethodArgumentNotValidException -> xử lý ở handler bên dưới
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response); // HTTP 200 + body là AuthResponse
        } catch (RuntimeException e) {
            // Lỗi nghiệp vụ (email đã tồn tại, ...) -> trả 400 Bad Request
            return buildError(HttpStatus.BAD_REQUEST, "Registration Failed", e.getMessage(), null);
        }
    }

    /**
     * POST /api/auth/login
     * Đăng nhập bằng email và password
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response); // HTTP 200 + JWT token
        } catch (RuntimeException e) {
            // Sai email/password hoặc tài khoản bị khóa -> trả 401 Unauthorized
            return buildError(HttpStatus.UNAUTHORIZED, "Authentication Failed", e.getMessage(), null);
        }
    }

    /**
     * POST /api/auth/google
     * Đăng nhập bằng Google OAuth2
     * Frontend gửi lên: { "idToken": "<Google ID Token>" }
     * Backend xác thực với Google và trả về JWT của hệ thống
     */
    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@Valid @RequestBody Googleauthrequest request) {
        try {
            AuthResponse response = googleAuthService.loginWithGoogle(request.getIdToken());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return buildError(HttpStatus.UNAUTHORIZED, "Google Authentication Failed", e.getMessage(), null);
        }
    }

    /**
     * POST /api/auth/logout
     * Đăng xuất
     * Vì dùng JWT stateless, server không lưu session nên không cần làm gì đặc biệt.
     * Frontend tự xóa token khỏi localStorage/cookie là xong.
     * Endpoint này chỉ để trả về message xác nhận.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logout successful");
        return ResponseEntity.ok(response);
    }

    /**
     * Xử lý lỗi validation từ @Valid
     * Khi request body không hợp lệ (thiếu field, sai format...), Spring tự gọi handler này
     * Ví dụ: gửi email sai format -> trả về:
     * { "email": "Email should be valid", "password": "Password is required" }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        // Gom tất cả lỗi validation vào Map: fieldName -> errorMessage
        Map<String, String> validationErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            validationErrors.put(fieldName, errorMessage);
        });

        // Xây dựng response lỗi đầy đủ thông tin
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value()) // 400
                .error("Validation Failed")
                .message("Invalid input data")
                .path(request.getRequestURI()) // Endpoint nào bị lỗi
                .validationErrors(validationErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Helper: Tạo ErrorResponse nhất quán cho các lỗi runtime
     */
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