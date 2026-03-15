package com.example.spring_project.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * User - Entity ánh xạ với bảng "users" trong database
 * Implements UserDetails: để Spring Security hiểu đây là đối tượng người dùng,
 * có thể dùng trực tiếp trong quá trình xác thực và phân quyền.
 */
@Entity                  // Đánh dấu đây là JPA Entity (ánh xạ với bảng DB)
@Table(name = "users")   // Tên bảng trong database
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Data                    // Lombok: tự tạo getter, setter, toString, equals, hashCode
@NoArgsConstructor       // Lombok: tạo constructor không tham số (JPA yêu cầu)
@AllArgsConstructor      // Lombok: tạo constructor với tất cả tham số
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto increment trong DB
    @Column(name = "user_id")
    private Integer userId;

    // Quan hệ nhiều User thuộc một Role
    // FetchType.EAGER: load Role ngay khi load User (không lazy load)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", referencedColumnName = "role_id", nullable = false)
    private Role role;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password", nullable = false, length = 255)
    private String password; // Lưu dưới dạng hash BCrypt, KHÔNG lưu password gốc

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "middle_name", length = 50)
    private String middleName; // Có thể null

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(name = "mobile_phone", length = 20, unique = true)
    private String mobilePhone; // Unique: không cho 2 user dùng cùng số điện thoại

    @Column(name = "birthday")
    private LocalDate birthday;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl; // URL ảnh đại diện (có thể từ Google)

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true; // Mặc định tài khoản đang hoạt động

    @Column(name = "is_black_list", nullable = false)
    private Boolean isBlackList = false; // Mặc định không bị blacklist

    // Soft delete: thay vì xóa hẳn, chỉ set deletedAt
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt; // null = chưa xóa, có giá trị = đã xóa

    @Column(name = "deleted_by")
    private Integer deletedBy; // ID của admin đã xóa

    // Audit fields: theo dõi khi nào và ai tạo/sửa
    @Column(name = "created_at", nullable = false, updatable = false) // updatable=false: không thể thay đổi sau khi tạo
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private Integer updatedBy;

    /**
     * Tự động set thời gian khi INSERT (tạo mới) record
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    /**
     * Tự động cập nhật updatedAt khi UPDATE record
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    // ═══════════════════════════════════════════════════════
    // Các method bắt buộc từ interface UserDetails
    // Spring Security dùng các method này để kiểm tra quyền và trạng thái tài khoản
    // ═══════════════════════════════════════════════════════

    /**
     * Trả về danh sách quyền (roles) của user
     * Format: "ROLE_ADMIN", "ROLE_CUSTOMER", ... (Spring Security yêu cầu prefix "ROLE_")
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.getName().toUpperCase()));
    }

    /**
     * Username trong Spring Security = email của user
     * Đây là "key" dùng để nhận diện user
     */
    @Override
    public String getUsername() {
        return email;
    }

    /** Tài khoản có hết hạn không? Luôn trả true (không có chức năng expire) */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * Tài khoản có bị khóa không?
     * Bị khóa khi: bị blacklist HOẶC đã bị xóa (soft delete)
     */
    @Override
    public boolean isAccountNonLocked() {
        return !isBlackList && deletedAt == null;
    }

    /** Credentials (password) có hết hạn không? Luôn trả true */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * Tài khoản có được phép đăng nhập không?
     * Chỉ cho đăng nhập khi: isActive = true VÀ chưa bị xóa
     */
    @Override
    public boolean isEnabled() {
        return isActive && deletedAt == null;
    }

    // ═══════════════════════════════════════════════════════
    // Các method tiện ích bổ sung
    // ═══════════════════════════════════════════════════════
    /** Kiểm tra user đã bị soft delete chưa */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /** Ghép họ tên đầy đủ (có xử lý trường hợp không có tên đệm) */
    public String getFullName() {
        if (middleName != null && !middleName.isEmpty()) {
            return firstName + " " + middleName + " " + lastName;
        }
        return firstName + " " + lastName;
    }
}