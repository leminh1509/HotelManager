package com.example.spring_project.service;

import com.example.spring_project.dto.RegisterRequest;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lưu OTP + thông tin đăng ký chờ xác thực.
 *
 * Tách thành @Component riêng (KHÔNG có @Transactional) để Spring
 * không bọc CGLIB proxy → đảm bảo chỉ có 1 instance duy nhất giữ Map.
 *
 * Map khai báo static để sống sót qua devtools hot-reload.
 */
@Component
public class OtpStore {

    private static final int TTL_MINUTES = 10;

    // ── static: tồn tại suốt vòng đời JVM, không bị reset khi devtools reload
    private static final Map<String, OtpEntry>        OTP_MAP     = new ConcurrentHashMap<>();
    private static final Map<String, RegisterRequest> PENDING_REG = new ConcurrentHashMap<>();

    // ── Inner class (Java 8+ compatible, không dùng record)
    public static class OtpEntry {
        private final String        code;
        private final LocalDateTime expiresAt;

        public OtpEntry(String code) {
            this.code      = code;
            this.expiresAt = LocalDateTime.now().plusMinutes(TTL_MINUTES);
        }

        public String getCode()      { return code; }
        public boolean isExpired()   { return LocalDateTime.now().isAfter(expiresAt); }
        public boolean isValid(String input) {
            return !isExpired() && code.equals(input == null ? "" : input.trim());
        }
    }

    // ── Lưu OTP cho email
    public void saveOtp(String email, String otp) {
        OTP_MAP.put(normalize(email), new OtpEntry(otp));
    }

    // ── Lưu thông tin đăng ký chờ xác thực
    public void savePending(String email, RegisterRequest request) {
        PENDING_REG.put(normalize(email), request);
    }

    // ── Kiểm tra OTP hợp lệ
    public boolean isOtpValid(String email, String otp) {
        OtpEntry entry = OTP_MAP.get(normalize(email));
        return entry != null && entry.isValid(otp);
    }

    // ── Lấy OTP entry (để log)
    public OtpEntry getOtpEntry(String email) {
        return OTP_MAP.get(normalize(email));
    }

    // ── Lấy thông tin đăng ký đang chờ
    public RegisterRequest getPending(String email) {
        return PENDING_REG.get(normalize(email));
    }

    // ── Xóa sau khi xác thực thành công
    public void clear(String email) {
        String key = normalize(email);
        OTP_MAP.remove(key);
        PENDING_REG.remove(key);
    }

    // ── Kiểm tra có pending registration không
    public boolean hasPending(String email) {
        return PENDING_REG.containsKey(normalize(email));
    }

    private String normalize(String email) {
        return email == null ? "" : email.toLowerCase().trim();
    }

    @PostConstruct
    public void init() {
        System.out.println("[OtpStore] Bean initialized. Instance: " + this.hashCode());
    }
}