package com.example.spring_project.config;

import com.example.spring_project.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor // Lombok tự tạo constructor với các field final
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Bỏ qua request kiểu OPTIONS (preflight CORS) ──
        // Trình duyệt gửi OPTIONS trước khi gửi request thật để hỏi server có cho phép không
        // Không cần xác thực JWT cho loại request này
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Đọc header Authorization từ request ──
        // Format chuẩn: "Authorization: Bearer <token>"
        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Không có token -> bỏ qua, để Security tự xử lý (sẽ trả 401 nếu endpoint cần đăng nhập)
            filterChain.doFilter(request, response);
            return;
        }

        //  Tách lấy phần token (bỏ chữ "Bearer " ở đầu) ──
        final String jwt = authHeader.substring(7); // "Bearer " có 7 ký tự

        // Giải mã token để lấy email của user ──
        String userEmail;
        try {
            userEmail = jwtUtil.extractUsername(jwt);
        } catch (Exception ex) {
            // Token lỗi cú pháp hoặc đã hết hạn -> bỏ qua, tiếp tục filter chain
            filterChain.doFilter(request, response);
            return;
        }

        //  Xác thực và đặt Authentication vào SecurityContext ──
        // Chỉ xử lý khi: email hợp lệ VÀ chưa có authentication nào trong context
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Load đầy đủ thông tin user từ database qua email
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // Kiểm tra token có hợp lệ không (đúng user + chưa hết hạn)
            boolean valid;
            try {
                valid = jwtUtil.validateToken(jwt, userDetails);
            } catch (Exception ex) {
                valid = false;
            }

            if (valid) {
                // Tạo đối tượng Authentication với thông tin user và quyền hạn
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,                        // Credentials (password) = null vì đã xác thực qua JWT
                                userDetails.getAuthorities() // Danh sách role/quyền của user
                        );

                // Gắn thêm chi tiết request (IP, session...) vào authentication
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                // Lưu authentication vào SecurityContext -> Spring Security biết user này đã đăng nhập
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        //  Tiếp tục chuyển request đến filter tiếp theo hoặc controller ──
        filterChain.doFilter(request, response);
    }
}