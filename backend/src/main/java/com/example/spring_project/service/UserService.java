package com.example.spring_project.service;

import com.example.spring_project.dto.ChangePasswordRequest;
import com.example.spring_project.dto.UpdateProfileRequest;
import com.example.spring_project.dto.UserResponse;
import com.example.spring_project.entity.User;
import com.example.spring_project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;


@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Lấy thông tin profile của user theo ID
     * @Transactional(readOnly = true): chỉ đọc, không ghi -> tối ưu hiệu năng DB
     */
    @Transactional(readOnly = true)
    public UserResponse getProfile(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Nếu user đã bị soft delete -> coi như không tồn tại
        if (user.isDeleted()) {
            throw new RuntimeException("User not found");
        }

        return toResponse(user);
    }

    /**
     * Cập nhật thông tin profile (họ tên, số điện thoại, ngày sinh)
     * User chỉ được sửa thông tin của chính mình (kiểm tra ở Controller)
     * @param updatedBy: ID của người thực hiện sửa (để ghi audit log)
     */
    @Transactional
    public UserResponse updateProfile(Integer id, UpdateProfileRequest request, Integer updatedBy) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isDeleted()) {
            throw new RuntimeException("User not found");
        }

        // ── Chuẩn hóa dữ liệu đầu vào ──
        // requireTrimmed: trim khoảng trắng và bắt buộc không được rỗng
        String firstName = requireTrimmed(request.getFirstName(), "First name is required");
        String lastName = requireTrimmed(request.getLastName(), "Last name is required");
        // trimToNull: trim khoảng trắng, nếu rỗng thì trả về null
        String middleName = trimToNull(request.getMiddleName());
        String mobilePhone = trimToNull(request.getMobilePhone());

        // ── Validate số điện thoại (nếu có nhập) ──
        if (mobilePhone != null && !mobilePhone.matches("^[0-9]{10,20}$")) {
            throw new RuntimeException("Mobile phone must be 10-20 digits");
        }

        // ── Kiểm tra số điện thoại trùng (chỉ khi user thay đổi số) ──
        if (mobilePhone != null && !mobilePhone.equals(user.getMobilePhone())) {
            boolean exists = userRepository.existsByMobilePhone(mobilePhone);
            if (exists) {
                throw new RuntimeException("Mobile phone already exists");
            }
        }

        // ── Parse ngày sinh từ String "yyyy-MM-dd" sang LocalDate ──
        LocalDate birthday = parseBirthdayOrNull(request.getBirthday());

        // ── Cập nhật thông tin user ──
        user.setFirstName(firstName);
        user.setMiddleName(middleName);
        user.setLastName(lastName);
        user.setMobilePhone(mobilePhone);
        user.setBirthday(birthday);
        user.setUpdatedBy(updatedBy); // Ghi lại ai đã sửa

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    /**
     * Đổi mật khẩu
     * Yêu cầu: nhập đúng mật khẩu cũ mới được đổi
     */
    @Transactional
    public void changePassword(Integer id, ChangePasswordRequest request, Integer updatedBy) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isDeleted()) {
            throw new RuntimeException("User not found");
        }

        String currentPassword = request.getCurrentPassword();
        String newPassword = request.getNewPassword();

        // Kiểm tra mật khẩu hiện tại có đúng không
        // passwordEncoder.matches(): so sánh password gốc với hash trong DB
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Mật khẩu mới phải đủ dài
        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }

        // Không cho đặt lại mật khẩu giống cũ
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("New password must be different from current password");
        }

        // Mã hóa mật khẩu mới trước khi lưu
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedBy(updatedBy);
        userRepository.save(user);
    }

    private final String UPLOAD_DIR = "uploads/avatars/";

    /**
     * Cập nhật ảnh đại diện
     */
    @Transactional
    public UserResponse updateAvatar(Integer userId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        // Tạo thư mục nếu chưa có
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Tên file: userId_timestamp_originalName
        String fileName = userId + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);

        // Lưu file vào local storage
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Lưu URL vào DB
        // Với local dev, ta sẽ trả về link dẫn tới chính backend (cần config static
        // resource)
        // Hoặc đơn giản là tên file để frontend tự ghép
        String avatarUrl = "http://localhost:9999/api/users/avatars/" + fileName;
        user.setAvatarUrl(avatarUrl);
        User saved = userRepository.save(user);

        return toResponse(saved);
    }

    // ═══════════════════════════════════════════════════════
    // Các phương thức helper nội bộ
    // ═══════════════════════════════════════════════════════
    /**
     * Chuyển User entity thành UserResponse DTO (che giấu thông tin nhạy cảm như
     * password)
     */
    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .userId(u.getUserId())
                .firstName(u.getFirstName())
                .middleName(u.getMiddleName())
                .lastName(u.getLastName())
                .email(u.getEmail())
                .mobilePhone(u.getMobilePhone())
                .birthday(u.getBirthday())
                .avatarUrl(u.getAvatarUrl())
                .roleId(u.getRole() != null ? u.getRole().getRoleId() : null)
                .roleName(u.getRole() != null ? u.getRole().getName() : null)
                .isActive(u.getIsActive())
                .isBlackList(u.getIsBlackList())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }

    /** Trim chuỗi, trả về null nếu chuỗi rỗng */
    private String trimToNull(String s) {
        if (s == null)
            return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /** Trim chuỗi, ném exception nếu kết quả là null/rỗng */
    private String requireTrimmed(String s, String msgIfBlank) {
        String t = trimToNull(s);
        if (t == null)
            throw new RuntimeException(msgIfBlank);
        return t;
    }

    /**
     * Parse chuỗi ngày sinh "yyyy-MM-dd" thành LocalDate
     * Trả về null nếu input rỗng
     * Ném exception nếu format sai hoặc ngày trong tương lai
     */
    private LocalDate parseBirthdayOrNull(String birthday) {
        String b = trimToNull(birthday);
        if (b == null)
            return null;

        try {
            LocalDate date = LocalDate.parse(b); // Mặc định parse theo format "yyyy-MM-dd"
            if (date.isAfter(LocalDate.now())) {
                throw new RuntimeException("Birthday must be in the past"); // Ngày sinh không thể trong tương lai
            }
            return date;
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Birthday must be in format yyyy-MM-dd");
        }
    }
}