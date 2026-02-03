package com.example.spring_project.controller;

import com.example.spring_project.dto.BookingCreateRequest;
import com.example.spring_project.dto.BookingResponse;
import com.example.spring_project.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // ─────────────────────────────────────────────────────
    // Helper: lấy userId từ Authentication principal
    // ─────────────────────────────────────────────────────
    private Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new RuntimeException("Not authenticated");
        }
        return (Integer) auth.getPrincipal(); // Adjusted to match perceived logic
    }

    // ─────────────────────────────────────────────────────
    // POST /api/bookings
    // Đặt phòng mới
    // ─────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody BookingCreateRequest request) {
        Integer userId = getCurrentUserId();
        BookingResponse response = bookingService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─────────────────────────────────────────────────────
    // GET /api/bookings/{bookingId}
    // Lấy chi tiết 1 booking
    // ─────────────────────────────────────────────────────
    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponse> getById(@PathVariable Integer bookingId) {
        BookingResponse response = bookingService.getById(bookingId);
        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────────────
    // GET /api/bookings/me
    // Lấy tất cả bookings của user đang login
    // ─────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<List<BookingResponse>> getMyBookings() {
        Integer userId = getCurrentUserId();
        List<BookingResponse> bookings = bookingService.getMyBookings(userId);
        return ResponseEntity.ok(bookings);
    }

    // ─────────────────────────────────────────────────────
    // PUT /api/bookings/{bookingId}/cancel
    // Hủy booking (User tự hủy)
    // ─────────────────────────────────────────────────────
    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponse> cancel(@PathVariable Integer bookingId) {
        Integer userId = getCurrentUserId();
        BookingResponse response = bookingService.cancel(bookingId, userId);
        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────────────
    // [NEW] GET /api/bookings
    // Lấy tất cả bookings (Admin / Receptionist)
    // ─────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        // Trong thực tế nên check Role ở SecurityConfig hoặc PreAuthorize
        // @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
        List<BookingResponse> list = bookingService.getAllBookings();
        return ResponseEntity.ok(list);
    }

    // ─────────────────────────────────────────────────────
    // [NEW] PUT /api/bookings/{bookingId}/status?status=...
    // Update status (Receptionist check-in, check-out...)
    // ─────────────────────────────────────────────────────
    @PutMapping("/{bookingId}/status")
    public ResponseEntity<BookingResponse> updateStatus(
            @PathVariable Integer bookingId,
            @RequestParam String status) {
        // @PreAuthorize("hasRole('RECEPTIONIST')")
        BookingResponse response = bookingService.updateStatus(bookingId, status);
        return ResponseEntity.ok(response);
    }
}