package com.example.spring_project.service;

import com.example.spring_project.dto.CreateUserRequest;
import com.example.spring_project.dto.UpdateUserRequest;
import com.example.spring_project.dto.UserResponse;
import com.example.spring_project.entity.Role;
import com.example.spring_project.entity.User;
import com.example.spring_project.repository.RoleRepository;
import com.example.spring_project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder; // ✅ THÊM MỚI

    // ✅ MỚI: Admin tạo tài khoản người dùng
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        log.info("Admin creating new user with email: {}", request.getEmail());

        // Kiểm tra email trùng
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists: " + request.getEmail());
        }

        // Kiểm tra phone trùng (nếu có nhập)
        if (request.getMobilePhone() != null && !request.getMobilePhone().isBlank()) {
            if (userRepository.existsByMobilePhone(request.getMobilePhone())) {
                throw new RuntimeException("Mobile phone already exists: " + request.getMobilePhone());
            }
        }

        // Lấy role
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + request.getRoleId()));

        // Tạo user mới
        User user = new User();
        user.setFirstName(request.getFirstName().trim());
        user.setMiddleName(request.getMiddleName() != null ? request.getMiddleName().trim() : null);
        user.setLastName(request.getLastName().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setMobilePhone(request.getMobilePhone() != null ? request.getMobilePhone().trim() : null);
        user.setBirthday(request.getBirthday());
        user.setRole(role);
        user.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        user.setIsBlackList(false);

        User saved = userRepository.save(user);
        log.info("Successfully created user with id: {}", saved.getUserId());

        return convertToUserResponse(saved);
    }

    // ✅ Optimized Search with Pagination
    public Page<UserResponse> getAllUsers(String keyword, String roleName, Pageable pageable) {
        if (keyword != null && keyword.trim().isEmpty())
            keyword = null;
        if (roleName != null && (roleName.trim().isEmpty() || roleName.equals("all")))
            roleName = null;

        return userRepository.searchUsers(roleName, keyword, pageable)
                .map(this::convertToUserResponse);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToUserResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return convertToUserResponse(user);
    }

    public List<UserResponse> getUsersByRole(String roleName) {
        return userRepository.findByRole_Name(roleName).stream()
                .map(this::convertToUserResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getUsersByRoleValidated(String roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        return userRepository.findByRole(role).stream()
                .map(this::convertToUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse updateUser(Integer userId, UpdateUserRequest request) {
        log.info("Updating user with ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if (request.getFirstName() != null && !request.getFirstName().trim().isEmpty()) {
            user.setFirstName(request.getFirstName().trim());
        }
        if (request.getMiddleName() != null) {
            user.setMiddleName(request.getMiddleName().trim());
        }
        if (request.getLastName() != null && !request.getLastName().trim().isEmpty()) {
            user.setLastName(request.getLastName().trim());
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists: " + request.getEmail());
            }
            user.setEmail(request.getEmail().trim().toLowerCase());
        }
        if (request.getMobilePhone() != null && !request.getMobilePhone().equals(user.getMobilePhone())) {
            if (userRepository.existsByMobilePhone(request.getMobilePhone())) {
                throw new RuntimeException("Mobile phone already exists: " + request.getMobilePhone());
            }
            user.setMobilePhone(request.getMobilePhone().trim());
        }
        if (request.getBirthday() != null) {
            user.setBirthday(request.getBirthday());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }
        if (request.getRoleId() != null) {
            Role newRole = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new RuntimeException("Role not found with id: " + request.getRoleId()));
            user.setRole(newRole);
        }
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }
        if (request.getIsBlackList() != null) {
            user.setIsBlackList(request.getIsBlackList());
        }

        User updatedUser = userRepository.save(user);
        log.info("Successfully updated user: {}", userId);
        return convertToUserResponse(updatedUser);
    }

    @Transactional
    public UserResponse changeUserRole(Integer userId, Integer roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        Role newRole = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));

        if (user.getRole().getRoleId().equals(roleId)) {
            throw new RuntimeException("User already has role: " + newRole.getName());
        }

        user.setRole(newRole);
        return convertToUserResponse(userRepository.saveAndFlush(user));
    }

    @Transactional
    public UserResponse toggleUserActive(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setIsActive(!user.getIsActive());
        return convertToUserResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse toggleUserBlacklist(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setIsBlackList(!user.getIsBlackList());
        return convertToUserResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Integer userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        try {
            userRepository.deleteById(userId);
            userRepository.flush();
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete user. User may have associated data: " + e.getMessage());
        }
    }

    @Transactional
    public void softDeleteUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setIsActive(false);
        userRepository.save(user);
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public long countUsersByRole(String roleName) {
        return userRepository.countByRole_Name(roleName);
    }

    public long countActiveUsers() {
        return userRepository.countByIsActiveTrue();
    }

    public long countBlacklistedUsers() {
        return userRepository.countByIsBlackListTrue();
    }

    private UserResponse convertToUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .firstName(user.getFirstName())
                .middleName(user.getMiddleName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .mobilePhone(user.getMobilePhone())
                .birthday(user.getBirthday())
                .avatarUrl(user.getAvatarUrl())
                .roleId(user.getRole().getRoleId())
                .roleName(user.getRole().getName())
                .isActive(user.getIsActive())
                .isBlackList(user.getIsBlackList())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}