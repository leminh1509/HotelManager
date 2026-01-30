package com.example.spring_project.service;

import com.example.spring_project.dto.UpdateUserRequest;
import com.example.spring_project.dto.UserResponse;
import com.example.spring_project.entity.Role;
import com.example.spring_project.entity.User;
import com.example.spring_project.repository.RoleRepository;
import com.example.spring_project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
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
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        return userRepository.findAll().stream()
                .filter(user -> user.getRole().getRoleId().equals(role.getRoleId()))
                .map(this::convertToUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse updateUser(Integer userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Cập nhật thông tin cơ bản
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getMiddleName() != null) {
            user.setMiddleName(request.getMiddleName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getMobilePhone() != null && !request.getMobilePhone().equals(user.getMobilePhone())) {
            if (userRepository.existsByMobilePhone(request.getMobilePhone())) {
                throw new RuntimeException("Mobile phone already exists");
            }
            user.setMobilePhone(request.getMobilePhone());
        }
        if (request.getBirthday() != null) {
            user.setBirthday(request.getBirthday());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        // Cập nhật role
        if (request.getRoleId() != null) {
            Role newRole = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new RuntimeException("Role not found with id: " + request.getRoleId()));
            user.setRole(newRole);
        }

        // Cập nhật trạng thái
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }
        if (request.getIsBlackList() != null) {
            user.setIsBlackList(request.getIsBlackList());
        }

        User updatedUser = userRepository.save(user);
        return convertToUserResponse(updatedUser);
    }

    @Transactional
    public UserResponse changeUserRole(Integer userId, Integer roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Role newRole = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);
        return convertToUserResponse(updatedUser);
    }

    /**
     * Kích hoạt/vô hiệu hóa tài khoản user
     */
    @Transactional
    public UserResponse toggleUserActive(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setIsActive(!user.getIsActive());
        User updatedUser = userRepository.save(user);
        return convertToUserResponse(updatedUser);
    }

    /**
     * Thêm/bỏ user vào blacklist
     */
    @Transactional
    public UserResponse toggleUserBlacklist(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setIsBlackList(!user.getIsBlackList());
        User updatedUser = userRepository.save(user);
        return convertToUserResponse(updatedUser);
    }

    /**
     * Xóa user (soft delete - vô hiệu hóa tài khoản)
     */
    @Transactional
    public void deleteUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setIsActive(false);
        userRepository.save(user);
    }

    /**
     * Xóa user vĩnh viễn (hard delete - chỉ dùng khi thực sự cần thiết)
     */
    @Transactional
    public void permanentDeleteUser(Integer userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
    }

    /**
     * Lấy danh sách tất cả roles
     */
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    /**
     * Thống kê số lượng users theo role
     */
    public long countUsersByRole(String roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        return userRepository.findAll().stream()
                .filter(user -> user.getRole().getRoleId().equals(role.getRoleId()))
                .count();
    }

    /**
     * Thống kê số lượng users active
     */
    public long countActiveUsers() {
        return userRepository.findAll().stream()
                .filter(User::getIsActive)
                .count();
    }

    /**
     * Thống kê số lượng users trong blacklist
     */
    public long countBlacklistedUsers() {
        return userRepository.findAll().stream()
                .filter(User::getIsBlackList)
                .count();
    }

    // Helper method để convert User entity sang UserResponse DTO
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