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

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class UserController {

    private final UserService userService;

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getProfile(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser) {

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

    // PUT /api/users/{id}
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
            UserResponse updated = userService.updateProfile(id, request, currentUser.getUserId());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(buildError(HttpStatus.BAD_REQUEST, e.getMessage(), "/api/users/" + id));
        }
    }

    // PUT /api/users/{id}/change-password
    @PutMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(
            @PathVariable Integer id,
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User currentUser) {

        // chỉ chính user mới được đổi mật khẩu của mình
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

    // Validation errors (@Valid)
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

    // Helpers
    private boolean canAccess(User currentUser, Integer targetId) {
        if (currentUser == null) return false;
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return isAdmin || currentUser.getUserId().equals(targetId);
    }

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