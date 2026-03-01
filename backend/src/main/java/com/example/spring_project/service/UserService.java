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

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserResponse getProfile(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isDeleted()) {
            throw new RuntimeException("User not found");
        }

        return toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(Integer id, UpdateProfileRequest request, Integer updatedBy) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isDeleted()) {
            throw new RuntimeException("User not found");
        }

        // Normalize input
        String firstName = requireTrimmed(request.getFirstName(), "First name is required");
        String lastName  = requireTrimmed(request.getLastName(), "Last name is required");
        String middleName = trimToNull(request.getMiddleName());
        String mobilePhone = trimToNull(request.getMobilePhone());

        // Validate phone if provided
        if (mobilePhone != null && !mobilePhone.matches("^[0-9]{10,20}$")) {
            throw new RuntimeException("Mobile phone must be 10-20 digits");
        }

        // Unique phone check (only when user changes phone)
        if (mobilePhone != null && !mobilePhone.equals(user.getMobilePhone())) {
            boolean exists = userRepository.existsByMobilePhone(mobilePhone);
            if (exists) {
                throw new RuntimeException("Mobile phone already exists");
            }
        }

        // Parse birthday
        LocalDate birthday = parseBirthdayOrNull(request.getBirthday());

        user.setFirstName(firstName);
        user.setMiddleName(middleName);
        user.setLastName(lastName);
        user.setMobilePhone(mobilePhone);
        user.setBirthday(birthday);
        user.setUpdatedBy(updatedBy);

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Transactional
    public void changePassword(Integer id, ChangePasswordRequest request, Integer updatedBy) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isDeleted()) {
            throw new RuntimeException("User not found");
        }

        String currentPassword = request.getCurrentPassword();
        String newPassword = request.getNewPassword();

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }

        // prevent reuse same password
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedBy(updatedBy);
        userRepository.save(user);
    }

    // ─────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────

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

    private String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private String requireTrimmed(String s, String msgIfBlank) {
        String t = trimToNull(s);
        if (t == null) throw new RuntimeException(msgIfBlank);
        return t;
    }

    private LocalDate parseBirthdayOrNull(String birthday) {
        String b = trimToNull(birthday);
        if (b == null) return null;

        try {
            LocalDate date = LocalDate.parse(b); // yyyy-MM-dd
            if (date.isAfter(LocalDate.now())) {
                throw new RuntimeException("Birthday must be in the past");
            }
            return date;
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Birthday must be in format yyyy-MM-dd");
        }
    }
}