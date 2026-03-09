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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

/**
 * Googleauthservice - Xử lý đăng nhập / đăng ký bằng Google OAuth2
 * Luồng hoạt động:
 * 1. Frontend lấy "ID Token" từ Google (sau khi user bấm "Đăng nhập bằng Google")
 * 2. Frontend gửi ID Token đó lên backend
 * 3. Backend xác thực token với server Google để lấy thông tin user
 * 4. Nếu user chưa có tài khoản -> tự động tạo mới
 * 5. Trả về JWT token của hệ thống để frontend dùng cho các request sau
 */
@Slf4j // Lombok tạo sẵn biến `log` để ghi log
@Service
@RequiredArgsConstructor
public class Googleauthservice {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    // Google Client ID lấy từ Google Cloud Console, cấu hình trong application.properties
    @Value("${google.client-id}")
    private String googleClientId;

    /**
     * Đăng nhập hoặc đăng ký tự động bằng Google ID Token
     */
    @Transactional
    public AuthResponse loginWithGoogle(String idToken) {

        // Xác thực ID Token với Google ──
        // Google sẽ confirm token này thật sự do họ cấp và chưa hết hạn
        GoogleIdToken.Payload payload = verifyGoogleToken(idToken);

        // Trích xuất thông tin user từ token (Google đã verify nên tin tưởng được)
        String email = payload.getEmail();
        String firstName = (String) payload.get("given_name");  // Tên
        String lastName = (String) payload.get("family_name");   // Họ
        String avatarUrl = (String) payload.get("picture");       // Ảnh đại diện

        // Xử lý trường hợp Google không cung cấp tên (một số tài khoản Google không có)
        if (firstName == null) firstName = email.split("@")[0]; // Dùng phần trước @ của email làm tên
        if (lastName == null) lastName = "";

        // Tìm user trong database theo email ──
        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;
        boolean isNewUser;

        if (existingUser.isPresent()) {
            // ── TRƯỜNG HỢP: User đã có tài khoản -> Đăng nhập ──
            user = existingUser.get();
            isNewUser = false;

            // Kiểm tra tài khoản có bị khóa không
            if (!user.getIsActive()) {
                throw new RuntimeException("Tài khoản của bạn đã bị vô hiệu hóa");
            }
            if (user.getIsBlackList()) {
                throw new RuntimeException("Tài khoản của bạn đã bị khóa");
            }

            // Cập nhật ảnh đại diện nếu user chưa có (lần đầu dùng Google login)
            if (user.getAvatarUrl() == null && avatarUrl != null) {
                user.setAvatarUrl(avatarUrl);
                userRepository.save(user);
            }
        } else {
            // ── TRƯỜNG HỢP: User chưa có tài khoản -> Tự động đăng ký ──
            isNewUser = true;

            // Lấy role mặc định là CUSTOMER
            Role customerRole = roleRepository.findByName("customer")
                    .orElseThrow(() -> new RuntimeException("Customer role not found"));

            // Tạo user mới từ thông tin Google
            user = new User();
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName.isEmpty() ? "." : lastName); // Dùng "." nếu không có họ
            user.setAvatarUrl(avatarUrl);
            user.setRole(customerRole);
            user.setIsActive(true);
            user.setIsBlackList(false);

            // Đặt password ngẫu nhiên vì user này không cần đăng nhập bằng email/password
            // UUID.randomUUID() tạo chuỗi 36 ký tự ngẫu nhiên, không ai đoán được
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));

            user = userRepository.save(user);
            log.info("New user registered via Google: {}", email);
        }

        // Tạo JWT token của hệ thống (không phải Google token) ──
        String token = jwtUtil.generateToken(user);

        // Trả về response ──
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

    /**
     * Xác thực Google ID Token với server Google
     * GoogleIdTokenVerifier gửi request đến Google để xác nhận:
     * - Token có chữ ký hợp lệ (do Google ký, không bị giả mạo)
     * - Token chưa hết hạn
     * - Token được cấp cho đúng ứng dụng (Client ID khớp)
     */
    private GoogleIdToken.Payload verifyGoogleToken(String idTokenString) {
        try {
            // Xây dựng bộ xác thực với Client ID của ứng dụng
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),         // Dùng HTTP thuần để kết nối Google
                    GsonFactory.getDefaultInstance() // Parser JSON
            )
                    .setAudience(Collections.singletonList(googleClientId)) // Chỉ chấp nhận token của app này
                    .build();

            // Gửi token đến Google để xác thực
            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                throw new RuntimeException("Invalid Google ID token"); // Token không hợp lệ
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            // Đảm bảo email đã được Google xác minh (không phải email chưa verify)
            if (!payload.getEmailVerified()) {
                throw new RuntimeException("Email chưa được xác minh bởi Google");
            }

            return payload;

        } catch (RuntimeException e) {
            throw e; // Ném lại RuntimeException để controller xử lý
        } catch (Exception e) {
            log.error("Google token verification failed", e);
            throw new RuntimeException("Không thể xác thực token Google: " + e.getMessage());
        }
    }
}