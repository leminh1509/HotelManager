package com.example.spring_project.controller;

import com.example.spring_project.dto.ErrorResponse;
import com.example.spring_project.dto.UpdateUserRequest;
import com.example.spring_project.dto.UserResponse;
import com.example.spring_project.entity.Role;
import com.example.spring_project.service.UserManagementService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final
    UserManagementService userManagementService;

    /**
     * Lấy danh sách tất cả users với phân trang
     * GET /api/admin/users?page=0&size=10&sort=userId,desc
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "userId") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        try {
            Sort sort = sortDir.equalsIgnoreCase("asc")
                    ? Sort.by(sortBy).ascending()
                    : Sort.by(sortBy).descending();

            Pageable pageable = PageRequest.of(page, size, sort);
            Page<UserResponse> users = userManagementService.getAllUsers(pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("users", users.getContent());
            response.put("currentPage", users.getNumber());
            response.put("totalItems", users.getTotalElements());
            response.put("totalPages", users.getTotalPages());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ErrorResponse error = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .error("Internal Server Error")
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Lấy danh sách tất cả users không phân trang
     * GET /api/admin/users/all
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllUsersNoPagination() {
        try {
            List<UserResponse> users = userManagementService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            ErrorResponse error = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .error("Internal Server Error")
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Lấy thông tin user theo ID
     * GET /api/admin/users/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable Integer userId) {
        try {
            UserResponse user = userManagementService.getUserById(userId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            ErrorResponse error = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.NOT_FOUND.value())
                    .error("Not Found")
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Lấy danh sách users theo role
     * GET /api/admin/users/role/{roleName}
     */
    @GetMapping("/role/{roleName}")
    public ResponseEntity<?> getUsersByRole(@PathVariable String roleName) {
        try {
            List<UserResponse> users = userManagementService.getUsersByRole(roleName);
            return ResponseEntity.ok(users);
        } catch (RuntimeException e) {
            ErrorResponse error = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.NOT_FOUND.value())
                    .error("Not Found")
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Cập nhật thông tin user
     * PUT /api/admin/users/{userId}
     */
    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(
            @PathVariable Integer userId,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        try {
            UserResponse updatedUser = userManagementService.updateUser(userId, request);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User updated successfully");
            response.put("user", updatedUser);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ErrorResponse error = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.BAD_REQUEST.value())
                    .error("Bad Request")
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Thay đổi role của user
     * PATCH /api/admin/users/{userId}/role
     */
    @PatchMapping("/{userId}/role")
    public ResponseEntity<?> changeUserRole(
            @PathVariable Integer userId,
            @RequestBody Map<String, Integer> payload
    ) {
        try {
            Integer roleId = payload.get("roleId");
            if (roleId == null) {
                throw new RuntimeException("Role ID is required");
            }

            UserResponse updatedUser = userManagementService.changeUserRole(userId, roleId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User role changed successfully");
            response.put("user", updatedUser);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ErrorResponse error = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.BAD_REQUEST.value())
                    .error("Bad Request")
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Kích hoạt/vô hiệu hóa tài khoản user
     * PATCH /api/admin/users/{userId}/toggle-active
     */
    @PatchMapping("/{userId}/toggle-active")
    public ResponseEntity<?> toggleUserActive(@PathVariable Integer userId) {
        try {
            UserResponse updatedUser = userManagementService.toggleUserActive(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", updatedUser.getIsActive()
                    ? "User activated successfully"
                    : "User deactivated successfully");
            response.put("user", updatedUser);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ErrorResponse error = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.NOT_FOUND.value())
                    .error("Not Found")
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Thêm/bỏ user vào blacklist
     * PATCH /api/admin/users/{userId}/toggle-blacklist
     */
    @PatchMapping("/{userId}/toggle-blacklist")
    public ResponseEntity<?> toggleUserBlacklist(@PathVariable Integer userId) {
        try {
            UserResponse updatedUser = userManagementService.toggleUserBlacklist(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", updatedUser.getIsBlackList()
                    ? "User added to blacklist"
                    : "User removed from blacklist");
            response.put("user", updatedUser);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ErrorResponse error = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.NOT_FOUND.value())
                    .error("Not Found")
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Xóa user (soft delete)
     * DELETE /api/admin/users/{userId}
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer userId) {
        try {
            userManagementService.deleteUser(userId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "User deleted successfully");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ErrorResponse error = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.NOT_FOUND.value())
                    .error("Not Found")
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Xóa user vĩnh viễn (hard delete)
     * DELETE /api/admin/users/{userId}/permanent
     */
    @DeleteMapping("/{userId}/permanent")
    public ResponseEntity<?> permanentDeleteUser(@PathVariable Integer userId) {
        try {
            userManagementService.permanentDeleteUser(userId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "User permanently deleted");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ErrorResponse error = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.NOT_FOUND.value())
                    .error("Not Found")
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Lấy danh sách tất cả roles
     * GET /api/admin/users/roles
     */
    @GetMapping("/roles/list")
    public ResponseEntity<?> getAllRoles() {
        try {
            List<Role> roles = userManagementService.getAllRoles();
            return ResponseEntity.ok(roles);
        } catch (Exception e) {
            ErrorResponse error = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .error("Internal Server Error")
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Thống kê users
     * GET /api/admin/users/statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getUserStatistics() {
        try {
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalUsers", userManagementService.getAllUsers().size());
            statistics.put("activeUsers", userManagementService.countActiveUsers());
            statistics.put("blacklistedUsers", userManagementService.countBlacklistedUsers());
            statistics.put("adminCount", userManagementService.countUsersByRole("admin"));
            statistics.put("receptionistCount", userManagementService.countUsersByRole("receptionist"));
            statistics.put("customerCount", userManagementService.countUsersByRole("customer"));
            statistics.put("maintenanceCount", userManagementService.countUsersByRole("maintenance"));

            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            ErrorResponse error = ErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .error("Internal Server Error")
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}