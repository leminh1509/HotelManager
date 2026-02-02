// package com.example.spring_project.controller;


// import com.example.spring_project.dto.BookingCreateRequest;
// import com.example.spring_project.dto.BookingResponse;
// import com.example.spring_project.service.BookingService;
// import jakarta.validation.Valid;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;

// @RestController
// @RequestMapping("/api/bookings")
// public class BookingController {

//     private final BookingService bookingService;

//     public BookingController(BookingService bookingService) {
//         this.bookingService = bookingService;
//     }

//     // ─────────────────────────────────────────────────────
//     // Helper: lấy userId từ Authentication principal
//     // Giả sử auth setup của bạn store userId (Integer) trong principal.
//     // Nếu project dùng custom UserDetails thì đổi thành:
//     //   ((MyUserDetails) auth.getPrincipal()).getUserId()
//     // ─────────────────────────────────────────────────────
//     private Integer getCurrentUserId() {
//         Authentication auth = SecurityContextHolder.getContext().getAuthentication();
//         if (auth == null || auth.getPrincipal() == null) {
//             throw new RuntimeException("Not authenticated");
//         }
//         // ── adjust theo cách project bạn store userId ──
//         // Option A: principal là Integer trực tiếp
//         // return (Integer) auth.getPrincipal();

//         // Option B: principal là custom UserDetails
//         // return ((com.example.hotelmanager.model.CustomUserDetails) auth.getPrincipal()).getUserId();

//         // Option C: fallback generic (dùng tạm)
//         return (Integer) auth.getPrincipal();
//     }

//     // ─────────────────────────────────────────────────────
//     // POST /api/bookings
//     // Đặt phòng mới
//     // ─────────────────────────────────────────────────────
//     @PostMapping
//     public ResponseEntity<BookingResponse> create(@Valid @RequestBody BookingCreateRequest request) {
//         Integer userId = getCurrentUserId();
//         BookingResponse response = bookingService.create(request, userId);
//         return ResponseEntity.status(HttpStatus.CREATED).body(response);
//     }

//     // ─────────────────────────────────────────────────────
//     // GET /api/bookings/{bookingId}
//     // Lấy chi tiết 1 booking
//     // ─────────────────────────────────────────────────────
//     @GetMapping("/{bookingId}")
//     public ResponseEntity<BookingResponse> getById(@PathVariable Integer bookingId) {
//         BookingResponse response = bookingService.getById(bookingId);
//         return ResponseEntity.ok(response);
//     }

//     // ─────────────────────────────────────────────────────
//     // GET /api/bookings/me
//     // Lấy tất cả bookings của user đang login
//     // ─────────────────────────────────────────────────────
//     @GetMapping("/me")
//     public ResponseEntity<List<BookingResponse>> getMyBookings() {
//         Integer userId = getCurrentUserId();
//         List<BookingResponse> bookings = bookingService.getMyBookings(userId);
//         return ResponseEntity.ok(bookings);
//     }

//     // ─────────────────────────────────────────────────────
//     // PUT /api/bookings/{bookingId}/cancel
//     // Hủy booking
//     // ─────────────────────────────────────────────────────
//     @PutMapping("/{bookingId}/cancel")
//     public ResponseEntity<BookingResponse> cancel(@PathVariable Integer bookingId) {
//         Integer userId = getCurrentUserId();
//         BookingResponse response = bookingService.cancel(bookingId, userId);
//         return ResponseEntity.ok(response);
//     }
// }