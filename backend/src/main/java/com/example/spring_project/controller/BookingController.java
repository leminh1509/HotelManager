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

    private Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new RuntimeException("Not authenticated");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof com.example.spring_project.entity.User) {
            return ((com.example.spring_project.entity.User) principal).getUserId();
        }
        throw new RuntimeException("Unknown principal type: " + principal.getClass().getName());
    }

    // Đặt phòng mới
    @PostMapping
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody BookingCreateRequest request) {
        Integer userId = getCurrentUserId();
        BookingResponse response = bookingService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Lấy chi tiết 1 booking
    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponse> getById(@PathVariable Integer bookingId) {
        BookingResponse response = bookingService.getById(bookingId);
        return ResponseEntity.ok(response);
    }

    // Hủy booking
    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponse> cancel(@PathVariable Integer bookingId) {
        Integer userId = getCurrentUserId();
        BookingResponse response = bookingService.cancel(bookingId, userId);
        return ResponseEntity.ok(response);
    }

    // Lấy tất cả bookings
    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        List<BookingResponse> list = bookingService.getAllBookings();
        return ResponseEntity.ok(list);
    }

    // Update status
    @PutMapping("/{bookingId}/status")
    public ResponseEntity<BookingResponse> updateStatus(
            @PathVariable Integer bookingId,
            @RequestParam String status) {
        BookingResponse response = bookingService.updateStatus(bookingId, status);
        return ResponseEntity.ok(response);
    }
}