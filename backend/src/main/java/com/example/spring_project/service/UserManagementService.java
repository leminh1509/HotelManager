package com.example.spring_project.service;

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
        log.info("Updating user with ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Cập nhật thông tin cơ bản
        if (request.getFirstName() != null && !request.getFirstName().trim().isEmpty()) {
            user.setFirstName(request.getFirstName().trim());
        }

        if (request.getMiddleName() != null) {
            user.setMiddleName(request.getMiddleName().trim());
        }

        if (request.getLastName() != null && !request.getLastName().trim().isEmpty()) {
            user.setLastName(request.getLastName().trim());
        }

        // Cập nhật email (kiểm tra duplicate)
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists: " + request.getEmail());
            }
            user.setEmail(request.getEmail().trim().toLowerCase());
        }

        // Cập nhật mobile phone (kiểm tra duplicate)
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

        // Cập nhật role nếu có
        if (request.getRoleId() != null) {
            Role newRole = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new RuntimeException("Role not found with id: " + request.getRoleId()));
            user.setRole(newRole);
            log.info("Updated user {} role to: {}", userId, newRole.getName());
        }

        // Cập nhật trạng thái
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
        log.info("Changing role for user {} to role {}", userId, roleId);

        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Validate role exists
        Role newRole = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));

        // Check if already has this role
        if (user.getRole().getRoleId().equals(roleId)) {
            log.warn("User {} already has role {}", userId, newRole.getName());
            throw new RuntimeException("User already has role: " + newRole.getName());
        }

        // Update role
        Role oldRole = user.getRole();
        user.setRole(newRole);

        // Save and flush to database
        User updatedUser = userRepository.saveAndFlush(user);

        log.info("Successfully changed user {} role from {} to {}",
                userId, oldRole.getName(), newRole.getName());

        return convertToUserResponse(updatedUser);
    }

    @Transactional
    public UserResponse toggleUserActive(Integer userId) {
        log.info("Toggling active status for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        boolean newStatus = !user.getIsActive();
        user.setIsActive(newStatus);

        User updatedUser = userRepository.save(user);
        log.info("User {} active status changed to: {}", userId, newStatus);

        return convertToUserResponse(updatedUser);
    }

    @Transactional
    public UserResponse toggleUserBlacklist(Integer userId) {
        log.info("Toggling blacklist status for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        boolean newStatus = !user.getIsBlackList();
        user.setIsBlackList(newStatus);

        User updatedUser = userRepository.save(user);
        log.info("User {} blacklist status changed to: {}", userId, newStatus);

        return convertToUserResponse(updatedUser);
    }

    @Transactional
    public void deleteUser(Integer userId) {
        log.info("Permanently deleting user: {}", userId);

        // Kiểm tra user có tồn tại không
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }

        try {
            userRepository.deleteById(userId);
            userRepository.flush(); // Ensure deletion is committed

            log.info("Successfully deleted user: {}", userId);
        } catch (Exception e) {
            log.error("Error deleting user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to delete user. User may have associated data: " + e.getMessage());
        }
    }

    @Transactional
    public void softDeleteUser(Integer userId) {
        log.info("Soft deleting user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setIsActive(false);
        userRepository.save(user);

        log.info("User {} deactivated (soft delete)", userId);
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public long countUsersByRole(String roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        return userRepository.findAll().stream()
                .filter(user -> user.getRole().getRoleId().equals(role.getRoleId()))
                .count();
    }

    public long countActiveUsers() {
        return userRepository.findAll().stream()
                .filter(User::getIsActive)
                .count();
    }

    public long countBlacklistedUsers() {
        return userRepository.findAll().stream()
                .filter(User::getIsBlackList)
                .count();
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