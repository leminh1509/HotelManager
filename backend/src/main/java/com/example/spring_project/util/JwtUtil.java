package com.example.spring_project.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JwtUtil - Lớp tiện ích xử lý JSON Web Token (JWT)
 * Chịu trách nhiệm: tạo token, xác thực token, đọc thông tin từ token
 */
@Component // Đánh dấu là Spring Bean, có thể inject vào nơi khác
public class JwtUtil {

    // Đọc secret key từ file application.properties (hoặc dùng giá trị mặc định nếu không có)
    @Value("${jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String secret;

    // Thời gian hết hạn token: mặc định 86400000ms = 24 giờ
    @Value("${jwt.expiration:86400000}")
    private Long expiration;

    /**
     * Lấy tên người dùng (email) từ token
     * Subject trong JWT chính là email của user
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Lấy thời gian hết hạn của token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Phương thức generic: lấy bất kỳ thông tin nào từ token
     * claimsResolver là một hàm (lambda) để chỉ định muốn lấy field nào
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Giải mã token và trả về toàn bộ Claims (payload của JWT)
     * Nếu token bị giả mạo hoặc sai chữ ký -> ném exception
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey()) // Dùng secret key để xác thực chữ ký
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Kiểm tra token đã hết hạn chưa
     * So sánh thời gian hết hạn với thời điểm hiện tại
     */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Xác thực token có hợp lệ không:
     * 1. Username trong token phải khớp với user hiện tại
     * 2. Token chưa hết hạn
     */
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    /**
     * Tạo JWT token cho người dùng
     * Chỉ dùng username (email) làm subject, không thêm claims đặc biệt
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>(); // Claims bổ sung (hiện để trống)
        return createToken(claims, userDetails.getUsername());
    }

    /**
     * Xây dựng JWT token với đầy đủ thông tin:
     * - claims: dữ liệu bổ sung (role, userId, ...)
     * - subject: email của user
     * - issuedAt: thời điểm tạo token
     * - expiration: thời điểm hết hạn = hiện tại + expiration
     * - signWith: ký bằng thuật toán HS256 với secret key
     */
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact(); // Tạo chuỗi token cuối cùng
    }

    /**
     * Chuyển secret string (base64) thành Key object để ký/xác thực token
     */
    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}