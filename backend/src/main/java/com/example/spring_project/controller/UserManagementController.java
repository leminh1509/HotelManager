package com.example.spring_project.controller;

import com.example.spring_project.dto.CreateUserRequest;
import com.example.spring_project.dto.UpdateUserRequest;
import com.example.spring_project.dto.UserResponse;
import com.example.spring_project.entity.Role;
import com.example.spring_project.service.UserManagementService;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UserManagementController - API quản lý user dành cho ADMIN
 * Base URL: /api/admin/users
 * Tất cả endpoint trong class này chỉ ADMIN mới được gọi
 * (@PreAuthorize("hasRole('ADMIN')") áp dụng cho toàn bộ class)
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')") // Chặn ngay từ đầu: chỉ ADMIN mới qua được
@RequiredArgsConstructor
public class UserManagementController {

    private final UserManagementService userManagementService;

    /**
     * POST /api/admin/users
     * Admin tạo tài khoản user mới (thay vì user tự đăng ký)
     * Dùng để tạo tài khoản RECEPTIONIST hoặc user đặc biệt
     */
    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            UserResponse created = userManagementService.createUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created); // HTTP 201 Created
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * GET /api/admin/users
     * Lấy danh sách user với filter và phân trang
     * Query params:
     * - keyword: tìm kiếm theo tên, email, số điện thoại
     * - role: lọc theo role (all/admin/customer/receptionist)
     * - page, size: phân trang (mặc định page=0, size=10)
     * - sortBy, sortDir: sắp xếp (mặc định theo userId tăng dần)
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "all") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "userId") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        try {
            // Tạo đối tượng Sort (sắp xếp tăng/giảm dần)
            Sort sort = sortDir.equalsIgnoreCase("desc")
                    ? Sort.by(sortBy).descending()
                    : Sort.by(sortBy).ascending();

            // Tạo Pageable: chứa thông tin trang + sắp xếp
            Pageable pageable = PageRequest.of(page, size, sort);

            // Gọi service lấy dữ liệu (trả về Page object)
            Page<UserResponse> pageResult = userManagementService.getAllUsers(keyword, role, pageable);

            // Đóng gói kết quả + metadata phân trang vào Map
            Map<String, Object> response = new HashMap<>();
            response.put("users", pageResult.getContent());         // Danh sách user của trang hiện tại
            response.put("currentPage", pageResult.getNumber());     // Trang hiện tại (0-indexed)
            response.put("totalPages", pageResult.getTotalPages());   // Tổng số trang
            response.put("totalItems", pageResult.getTotalElements()); // Tổng số user
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * GET /api/admin/users/statistics
     * Thống kê tổng quan về user (dùng cho dashboard admin)
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", userManagementService.getAllUsers().size()); // Tổng số user
            stats.put("activeUsers", userManagementService.countActiveUsers()); // Số user đang hoạt động
            stats.put("blacklistedUsers", userManagementService.countBlacklistedUsers()); // Số user bị blacklist
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * GET /api/admin/users/roles/list
     * Lấy danh sách tất cả các role trong hệ thống
     * Dùng để populate dropdown khi admin tạo/sửa user
     */
    @GetMapping("/roles/list")
    public ResponseEntity<?> getRoles() {
        try {
            List<Role> roles = userManagementService.getAllRoles();
            return ResponseEntity.ok(roles);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * PUT /api/admin/users/{userId}
     * Cập nhật toàn bộ thông tin user (admin có quyền sửa tất cả fields)
     */
    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Integer userId,
                                        @Valid @RequestBody UpdateUserRequest request) {
        try {
            UserResponse updated = userManagementService.updateUser(userId, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * PATCH /api/admin/users/{userId}/role
     * Chỉ thay đổi role của user
     * Body: { "roleId": 2 }
     * PATCH dùng khi chỉ cập nhật một phần (khác PUT phải gửi toàn bộ)
     */
    @PatchMapping("/{userId}/role")
    public ResponseEntity<?> changeRole(@PathVariable Integer userId,
                                        @RequestBody Map<String, Integer> body) {
        try {
            UserResponse updated = userManagementService.changeUserRole(userId, body.get("roleId"));
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * PATCH /api/admin/users/{userId}/toggle-active
     * Bật/tắt trạng thái active của user (vô hiệu hóa hoặc kích hoạt lại tài khoản)
     * Toggle: nếu đang true -> false, nếu đang false -> true
     */
    @PatchMapping("/{userId}/toggle-active")
    public ResponseEntity<?> toggleActive(@PathVariable Integer userId) {
        try {
            UserResponse updated = userManagementService.toggleUserActive(userId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * DELETE /api/admin/users/{userId}
     * Xóa hẳn user khỏi database (hard delete)
     * Lưu ý: nếu user có dữ liệu liên quan (booking, ...) sẽ fail vì foreign key constraint
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer userId) {
        try {
            userManagementService.deleteUser(userId);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}