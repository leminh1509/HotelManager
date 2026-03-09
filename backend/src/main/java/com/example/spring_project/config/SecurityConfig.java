package com.example.spring_project.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

/**
 * SecurityConfig - Cấu hình bảo mật trung tâm của ứng dụng
 * File này quyết định:
 * - Ai được phép truy cập endpoint nào
 * - Cách xác thực người dùng
 * - Cấu hình CORS (cho phép frontend gọi API)
 * - Cấu hình mã hóa mật khẩu
 */
@Configuration        // Đánh dấu đây là lớp cấu hình Spring
@EnableWebSecurity    // Bật Spring Security
@EnableMethodSecurity // Cho phép dùng @PreAuthorize trên từng method/controller
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter; // Filter JWT đã tạo ở trên
    private final UserDetailsService userDetailsService;  // Service load user từ DB

    /**
     * ══════════════════════════════════════════
     * CẤU HÌNH CHÍNH: Quy tắc bảo mật cho HTTP
     * ══════════════════════════════════════════
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // ── 1. Tắt CSRF ──
                // CSRF chỉ cần thiết với session-based auth.
                // Vì dùng JWT (stateless) nên tắt đi cho đơn giản
                .csrf(AbstractHttpConfigurer::disable)

                // ── 2. Cấu hình CORS ──
                // Cho phép frontend (React/Vue) ở domain khác gọi API
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // ── 3. Phân quyền từng endpoint ──
                .authorizeHttpRequests(auth -> auth

                        // Cho phép Spring xử lý lỗi nội bộ (forward đến /error)
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/error")).permitAll()

                        // Cho phép tất cả request OPTIONS (CORS preflight)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Endpoint đăng ký/đăng nhập: ai cũng vào được (chưa cần token)
                        .requestMatchers(new AntPathRequestMatcher("/api/auth/**")).permitAll()

                        // Endpoint công khai: ai cũng vào được
                        .requestMatchers(new AntPathRequestMatcher("/api/public/**")).permitAll()

                        // Chỉ ADMIN mới vào được /api/admin/**
                        .requestMatchers(new AntPathRequestMatcher("/api/admin/**")).hasRole("ADMIN")

                        // RECEPTIONIST hoặc ADMIN mới vào được /api/receptionist/**
                        .requestMatchers(new AntPathRequestMatcher("/api/receptionist/**"))
                        .hasAnyRole("RECEPTIONIST", "ADMIN")

                        // CUSTOMER hoặc ADMIN mới vào được /api/customer/**
                        .requestMatchers(new AntPathRequestMatcher("/api/customer/**"))
                        .hasAnyRole("CUSTOMER", "ADMIN")

                        // Xem danh sách phòng và danh mục: công khai (không cần login)
                        .requestMatchers(new AntPathRequestMatcher("/api/rooms/**", "GET")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/categories/**", "GET")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/ws/**")).permitAll()

                        // Đặt phòng: phải đăng nhập
                        .requestMatchers(new AntPathRequestMatcher("/api/bookings/**")).authenticated()

                        // Tất cả endpoint còn lại: phải đăng nhập
                        .anyRequest().authenticated()
                )

                // ── 4. Xử lý lỗi xác thực ── trả về JSON thay vì HTML mặc định
                        .anyRequest().authenticated())
                // ✅ trả JSON rõ ràng thay vì 403/HTML khó debug
                .exceptionHandling(ex -> ex
                        // 401 Unauthorized: chưa đăng nhập hoặc token không hợp lệ
                        .authenticationEntryPoint((req, res, e) -> {
                            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            res.setContentType("application/json");
                            res.getWriter().write("{\"message\":\"Unauthorized\"}");
                        })
                        // 403 Forbidden: đã đăng nhập nhưng không đủ quyền
                        .accessDeniedHandler((req, res, e) -> {
                            res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            res.setContentType("application/json");
                            res.getWriter().write("{\"message\":\"Forbidden\"}");
                        })
                )

                // ── 5. Stateless session ──
                // Không lưu session trên server, mỗi request phải tự mang JWT
                        }))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ── 6. Đăng ký AuthenticationProvider (cách xác thực username/password) ──
                .authenticationProvider(authenticationProvider())

                // ── 7. Đặt JwtFilter TRƯỚC filter xác thực username/password mặc định ──
                // Để JWT được kiểm tra trước khi Spring Security kiểm tra session
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * AuthenticationProvider - Cơ chế xác thực dùng database
     * Khi login bằng email/password, Spring sẽ dùng provider này để:
     * 1. Load user từ DB qua email
     * 2. So sánh password đã mã hóa
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService); // Cách load user
        authProvider.setPasswordEncoder(passwordEncoder());     // Cách kiểm tra password
        return authProvider;
    }

    /**
     * AuthenticationManager - Điều phối quá trình xác thực
     * AuthService dùng bean này để gọi authenticate(email, password)
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * PasswordEncoder - Mã hóa mật khẩu bằng BCrypt
     * BCrypt tự thêm "salt" ngẫu nhiên -> cùng password sẽ ra hash khác nhau mỗi lần
     * Rất an toàn, không thể reverse được
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * CorsConfigurationSource - Cấu hình CORS
     * CORS = Cross-Origin Resource Sharing
     * Cho phép frontend chạy ở domain/port khác gọi API của backend
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Danh sách origin (địa chỉ frontend) được phép gọi API
        config.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",  // React app thường dùng port này
                "http://localhost:3001",  // Port dự phòng
                "http://localhost:5173"   // Vite dev server
        ));

        // Các HTTP method được cho phép (thêm PATCH để hỗ trợ cập nhật một phần)
        config.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Cho phép tất cả header (bao gồm Authorization để gửi JWT)
        config.setAllowedHeaders(Arrays.asList("*"));

        // Cho phép gửi cookie/credentials theo request
        config.setAllowCredentials(true);

        // Frontend có thể đọc header Authorization từ response
        config.setExposedHeaders(Arrays.asList("Authorization"));

        // Áp dụng cấu hình này cho tất cả đường dẫn "/**"
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}