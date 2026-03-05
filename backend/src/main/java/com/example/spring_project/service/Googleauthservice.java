package com.example.spring_project.service;
import com.example.spring_project.dto.AuthResponse;
import com.example.spring_project.entity.Role;
import com.example.spring_project.entity.User;
import com.example.spring_project.repository.RoleRepository;
import com.example.spring_project.repository.UserRepository;
import com.example.spring_project.util.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;
@Slf4j
@Service
@RequiredArgsConstructor
public class Googleauthservice {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtUtil jwtUtil;

    @Value("${google.client-id}")
    private String googleClientId;

    @Transactional
    public AuthResponse loginWithGoogle(String idToken) {
        // 1. Verify Google ID Token
        GoogleIdToken.Payload payload = verifyGoogleToken(idToken);

        String email = payload.getEmail();
        String firstName = (String) payload.get("given_name");
        String lastName = (String) payload.get("family_name");
        String avatarUrl = (String) payload.get("picture");

        if (firstName == null) firstName = email.split("@")[0];
        if (lastName == null) lastName = "";

        // 2. Find or create user
        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;
        boolean isNewUser;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            isNewUser = false;

            // Check account status
            if (!user.getIsActive()) {
                throw new RuntimeException("Tài khoản của bạn đã bị vô hiệu hóa");
            }
            if (user.getIsBlackList()) {
                throw new RuntimeException("Tài khoản của bạn đã bị khóa");
            }

            // Update avatar if not set
            if (user.getAvatarUrl() == null && avatarUrl != null) {
                user.setAvatarUrl(avatarUrl);
                userRepository.save(user);
            }
        } else {
            // Auto-register new user with Google
            isNewUser = true;

            Role customerRole = roleRepository.findByName("customer")
                    .orElseThrow(() -> new RuntimeException("Customer role not found"));

            user = new User();
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName.isEmpty() ? "." : lastName);
            user.setAvatarUrl(avatarUrl);
            user.setRole(customerRole);
            user.setIsActive(true);
            user.setIsBlackList(false);
            // Random password vì user login bằng Google, không cần password
            user.setPassword(UUID.randomUUID().toString());

            user = userRepository.save(user);
            log.info("New user registered via Google: {}", email);
        }

        // 3. Generate JWT
        String token = jwtUtil.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().getName())
                .message(isNewUser ? "Đăng ký thành công qua Google" : "Đăng nhập thành công qua Google")
                .build();
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                throw new RuntimeException("Invalid Google ID token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            // Kiểm tra email đã được verify bởi Google
            if (!payload.getEmailVerified()) {
                throw new RuntimeException("Email chưa được xác minh bởi Google");
            }

            return payload;

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token verification failed", e);
            throw new RuntimeException("Không thể xác thực token Google: " + e.getMessage());
        }
    }
}
