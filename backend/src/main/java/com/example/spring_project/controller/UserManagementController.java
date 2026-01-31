package com.example.spring_project.controller;

import com.example.spring_project.dto.ErrorResponse;
import com.example.spring_project.dto.UpdateUserRequest;
import com.example.spring_project.dto.UserResponse;
import com.example.spring_project.entity.Role;
import com.example.spring_project.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class UserManagementController {

    private final UserManagementService userManagementService;

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
            log.error("Error getting all users: ", e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * Lấy danh sách tất cả users không phân trang
     * GET /api/admin/users/all
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllUsersNoPagination() {
        try {
            log.info("Fetching all users without pagination");
            List<UserResponse> users = userManagementService.getAllUsers();
            log.info("Found {} users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error getting all users: ", e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * Lấy thông tin user theo ID
     * GET /api/admin/users/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable Integer userId) {
        try {
            log.info("Getting user by ID: {}", userId);
            UserResponse user = userManagementService.getUserById(userId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            log.error("User not found: {}", userId);
            return buildErrorResponse(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Lấy danh sách users theo role
     * GET /api/admin/users/role/{roleName}
     */
    @GetMapping("/role/{roleName}")
    public ResponseEntity<?> getUsersByRole(@PathVariable String roleName) {
        try {
            log.info("Getting users by role: {}", roleName);
            List<UserResponse> users = userManagementService.getUsersByRole(roleName);
            return ResponseEntity.ok(users);
        } catch (RuntimeException e) {
            log.error("Error getting users by role {}: ", roleName, e);
            return buildErrorResponse(HttpStatus.NOT_FOUND, e.getMessage());
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
            log.info("Updating user: {}", userId);
            UserResponse updatedUser = userManagementService.updateUser(userId, request);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User updated successfully");
            response.put("user", updatedUser);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating user {}: ", userId, e);
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Thay đổi role của user
     * PATCH /api/admin/users/{userId}/role
     * FIX: Better logging and error handling
     */
    @PatchMapping("/{userId}/role")
    public ResponseEntity<?> changeUserRole(
            @PathVariable Integer userId,
            @RequestBody Map<String, Integer> payload
    ) {
        try {
            Integer roleId = payload.get("roleId");

            log.info("====== CHANGE ROLE REQUEST ======");
            log.info("User ID: {}", userId);
            log.info("New Role ID: {}", roleId);
            log.info("Request Payload: {}", payload);

            if (roleId == null) {
                log.error("Role ID is null in request");
                return buildErrorResponse(HttpStatus.BAD_REQUEST, "Role ID is required");
            }

            UserResponse updatedUser = userManagementService.changeUserRole(userId, roleId);

            log.info("Successfully changed role for user {} to role {}", userId, roleId);
            log.info("User new role: {}", updatedUser.getRoleName());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User role changed successfully");
            response.put("user", updatedUser);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("Error changing role for user {}: {}", userId, e.getMessage());
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Kích hoạt/vô hiệu hóa tài khoản user
     * PATCH /api/admin/users/{userId}/toggle-active
     */
    @PatchMapping("/{userId}/toggle-active")
    public ResponseEntity<?> toggleUserActive(@PathVariable Integer userId) {
        try {
            log.info("Toggling active status for user: {}", userId);
            UserResponse updatedUser = userManagementService.toggleUserActive(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", updatedUser.getIsActive()
                    ? "User activated successfully"
                    : "User deactivated successfully");
            response.put("user", updatedUser);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error toggling active status for user {}: ", userId, e);
            return buildErrorResponse(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Thêm/bỏ user vào blacklist
     * PATCH /api/admin/users/{userId}/toggle-blacklist
     */
    @PatchMapping("/{userId}/toggle-blacklist")
    public ResponseEntity<?> toggleUserBlacklist(@PathVariable Integer userId) {
        try {
            log.info("Toggling blacklist status for user: {}", userId);
            UserResponse updatedUser = userManagementService.toggleUserBlacklist(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", updatedUser.getIsBlackList()
                    ? "User added to blacklist"
                    : "User removed from blacklist");
            response.put("user", updatedUser);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error toggling blacklist for user {}: ", userId, e);
            return buildErrorResponse(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Xóa user VĨNH VIỄN (Hard Delete)
     * DELETE /api/admin/users/{userId}
     * FIX: Xóa thật sự khỏi database
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer userId) {
        try {
            log.info("Deleting user permanently: {}", userId);
            userManagementService.deleteUser(userId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "User deleted successfully");

            log.info("User {} deleted successfully", userId);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("Error deleting user {}: ", userId, e);
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Soft delete - Vô hiệu hóa user
     * PATCH /api/admin/users/{userId}/deactivate
     */
    @PatchMapping("/{userId}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Integer userId) {
        try {
            log.info("Deactivating user: {}", userId);
            userManagementService.softDeleteUser(userId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "User deactivated successfully");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error deactivating user {}: ", userId, e);
            return buildErrorResponse(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Lấy danh sách tất cả roles
     * GET /api/admin/users/roles/list
     */
    @GetMapping("/roles/list")
    public ResponseEntity<?> getAllRoles() {
        try {
            log.info("Fetching all roles");
            List<Role> roles = userManagementService.getAllRoles();
            log.info("Found {} roles", roles.size());
            return ResponseEntity.ok(roles);
        } catch (Exception e) {
            log.error("Error fetching roles: ", e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * Thống kê users
     * GET /api/admin/users/statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getUserStatistics() {
        try {
            log.info("Fetching user statistics");
            Map<String, Object> statistics = new HashMap<>();

            statistics.put("totalUsers", userManagementService.getAllUsers().size());
            statistics.put("activeUsers", userManagementService.countActiveUsers());
            statistics.put("blacklistedUsers", userManagementService.countBlacklistedUsers());
            statistics.put("adminCount", userManagementService.countUsersByRole("admin"));
            statistics.put("receptionistCount", userManagementService.countUsersByRole("receptionist"));
            statistics.put("customerCount", userManagementService.countUsersByRole("customer"));
            statistics.put("maintenanceCount", userManagementService.countUsersByRole("maintenance"));

            log.info("Statistics: {}", statistics);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("Error fetching statistics: ", e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    /**
     * Helper method để build error response
     */
    private ResponseEntity<?> buildErrorResponse(HttpStatus status, String message) {
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .build();
        return ResponseEntity.status(status).body(error);
    }
}