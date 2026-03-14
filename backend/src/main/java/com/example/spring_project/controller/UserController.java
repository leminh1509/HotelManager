package com.example.spring_project.controller;

import com.example.spring_project.dto.ChangePasswordRequest;
import com.example.spring_project.dto.ErrorResponse;
import com.example.spring_project.dto.UpdateProfileRequest;
import com.example.spring_project.dto.UserResponse;
import com.example.spring_project.entity.User;
import com.example.spring_project.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * UserController - API cho user quản lý profile cá nhân
 * Base URL: /api/users
 * Khác UserManagementController (admin quản lý tất cả),
 * controller này cho phép user xem/sửa thông tin của chính mình.
 * Quy tắc truy cập:
 * - User thường: chỉ xem/sửa profile của mình (id phải khớp với id đang đăng
 * nhập)
 * - Admin: có thể xem/sửa profile của bất kỳ ai
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class UserController {

    private final UserService userService;

    /**
     * GET /api/users/{id}
     * Lấy thông tin profile của user theo ID
     * 
     * @AuthenticationPrincipal: Spring tự inject đối tượng User đang đăng nhập vào
     *                           đây
     *                           (Lấy từ SecurityContext, do JwtAuthenticationFilter
     *                           đã set trước đó)
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProfile(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser) { // User đang đăng nhập

        // Kiểm tra quyền truy cập: chỉ chính user hoặc admin mới được xem
        if (!canAccess(currentUser, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(buildError(HttpStatus.FORBIDDEN, "Access denied", "/api/users/" + id));
        }

        try {
            UserResponse profile = userService.getProfile(id);
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(buildError(HttpStatus.NOT_FOUND, e.getMessage(), "/api/users/" + id));
        }
    }

    /**
     * PUT /api/users/{id}
     * Cập nhật thông tin profile (họ tên, số điện thoại, ngày sinh)
     * Không cho phép sửa email hay role qua endpoint này
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal User currentUser) {

        if (!canAccess(currentUser, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(buildError(HttpStatus.FORBIDDEN, "Access denied", "/api/users/" + id));
        }

        try {
            // Truyền currentUser.getUserId() để service biết ai đang sửa (audit log)
            UserResponse updated = userService.updateProfile(id, request, currentUser.getUserId());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(buildError(HttpStatus.BAD_REQUEST, e.getMessage(), "/api/users/" + id));
        }
    }

    /**
     * PUT /api/users/{id}/change-password
     * Đổi mật khẩu
     * Chính sách: ONLY user đó mới được đổi mật khẩu của mình
     * (Admin cũng không được đổi password thay user qua endpoint này)
     */
    @PutMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(
            @PathVariable Integer id,
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User currentUser) {

        // Kiểm tra chặt hơn: phải là chính user đó, không chấp nhận admin
        if (currentUser == null || !currentUser.getUserId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(buildError(HttpStatus.FORBIDDEN,
                            "You can only change your own password",
                            "/api/users/" + id + "/change-password"));
        }

        try {
            userService.changePassword(id, request, currentUser.getUserId());
            Map<String, String> res = new HashMap<>();
            res.put("message", "Password changed successfully");
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(buildError(HttpStatus.BAD_REQUEST, e.getMessage(),
                            "/api/users/" + id + "/change-password"));
        }
    }

    /**
     * POST /api/users/{id}/avatar
     * Cập nhật ảnh đại diện cho user
     */
    @PostMapping("/{id}/avatar")
    public ResponseEntity<?> updateAvatar(
            @PathVariable Integer id,
            @RequestParam("avatar") MultipartFile file,
            @AuthenticationPrincipal User currentUser) {

        if (!canAccess(currentUser, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(buildError(HttpStatus.FORBIDDEN, "Access denied", "/api/users/" + id + "/avatar"));
        }

        try {
            UserResponse updated = userService.updateAvatar(id, file);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(buildError(HttpStatus.BAD_REQUEST, e.getMessage(), "/api/users/" + id + "/avatar"));
        }
    }

    /**
     * Xử lý lỗi validation từ @Valid (khi dữ liệu request không hợp lệ)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        Map<String, String> validationErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(err -> {
            String field = ((FieldError) err).getField();
            validationErrors.put(field, err.getDefaultMessage());
        });

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Failed")
                .message("Invalid input data")
                .path(request.getRequestURI())
                .validationErrors(validationErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Kiểm tra currentUser có được phép thao tác với targetId không
     * Điều kiện PASS: là ADMIN, HOẶC đang thao tác với chính mình
     */
    private boolean canAccess(User currentUser, Integer targetId) {
        if (currentUser == null)
            return false;
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return isAdmin || currentUser.getUserId().equals(targetId);
    }

    /** Tạo ErrorResponse chuẩn */
    private ErrorResponse buildError(HttpStatus status, String message, String path) {
        return ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(path)
                .build();
    }
}