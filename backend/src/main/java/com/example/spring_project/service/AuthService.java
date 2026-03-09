package com.example.spring_project.service;

import com.example.spring_project.dto.AuthResponse;
import com.example.spring_project.dto.LoginRequest;
import com.example.spring_project.dto.RegisterRequest;
import com.example.spring_project.entity.Role;
import com.example.spring_project.entity.User;
import com.example.spring_project.repository.RoleRepository;
import com.example.spring_project.repository.UserRepository;
import com.example.spring_project.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;       // Truy cập database bảng users
    private final RoleRepository roleRepository;       // Truy cập database bảng role
    private final PasswordEncoder passwordEncoder;     // Mã hóa mật khẩu (BCrypt)
    private final JwtUtil jwtUtil;                     // Tạo JWT token
    private final AuthenticationManager authenticationManager; // Xác thực username/password

    /**
     * ═══════════════════════════════
     * ĐĂNG KÝ TÀI KHOẢN MỚI
     * ═══════════════════════════════
     * @Transactional: nếu có lỗi giữa chừng, rollback toàn bộ (không lưu nửa vời vào DB)
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        // ── Kiểm tra email đã tồn tại chưa ──
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // ── Kiểm tra số điện thoại đã tồn tại chưa (nếu user có nhập) ──
        if (request.getMobilePhone() != null && userRepository.existsByMobilePhone(request.getMobilePhone())) {
            throw new RuntimeException("Mobile phone already registered");
        }

        // ── Lấy role mặc định "customer" từ database ──
        // Tất cả người đăng ký mới đều là CUSTOMER
        Role customerRole = roleRepository.findByName("customer")
                .orElseThrow(() -> new RuntimeException("Customer role not found"));

        // ── Tạo đối tượng User mới và fill thông tin ──
        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setMiddleName(request.getMiddleName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Mã hóa password trước khi lưu!
        user.setMobilePhone(request.getMobilePhone());
        user.setBirthday(request.getBirthday());
        user.setRole(customerRole);
        user.setIsActive(true);       // Tài khoản mới mặc định đang hoạt động
        user.setIsBlackList(false);   // Chưa bị blacklist

        // ── Lưu user vào database ──
        User savedUser = userRepository.save(user);

        // ── Tạo JWT token cho user vừa đăng ký (đăng nhập luôn sau khi đăng ký) ──
        String token = jwtUtil.generateToken(savedUser);

        // ── Trả về response với token và thông tin user ──
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(savedUser.getUserId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .role(savedUser.getRole().getName())
                .message("Registration successful")
                .build();
    }

    /**
     * ═══════════════════════════════
     * ĐĂNG NHẬP
     * ═══════════════════════════════
     */
    public AuthResponse login(LoginRequest request) {

        // ── Bước 1: Xác thực email và password ──
        // authenticationManager sẽ: load user từ DB -> so sánh password đã mã hóa
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            // Sai email hoặc sai password
            throw new RuntimeException("Invalid email or password");
        }

        // ── Bước 2: Load đầy đủ thông tin user từ DB ──
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ── Bước 3: Kiểm tra trạng thái tài khoản ──
        if (!user.getIsActive()) {
            throw new RuntimeException("Account is inactive"); // Tài khoản bị vô hiệu hóa
        }

        if (user.getIsBlackList()) {
            throw new RuntimeException("Account is blacklisted"); // Tài khoản bị cấm
        }

        // ── Bước 4: Tạo JWT token ──
        String token = jwtUtil.generateToken(user);

        // ── Bước 5: Trả về response ──
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().getName())
                .message("Login successful")
                .build();
    }
}