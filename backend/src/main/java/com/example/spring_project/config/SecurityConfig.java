package com.example.spring_project.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll() // Cho phép truy cập tất cả API mà không cần đăng nhập
                )
                .csrf(csrf -> csrf.disable()) // Tắt CSRF để API hoạt động bình thường với React
                .formLogin(login -> login.disable()); // Không hiển thị form login

        return http.build();
    }
}