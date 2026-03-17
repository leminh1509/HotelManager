package com.example.spring_project.controller;

import com.example.spring_project.dto.BookingResponse;
import com.example.spring_project.dto.UserResponse;
import com.example.spring_project.service.BookingService;
import com.example.spring_project.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/receptionist/customers")
@PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
@RequiredArgsConstructor
public class CustomerController {

    private final UserManagementService userService;
    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String keyword) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<UserResponse> pageResult = userService.getAllUsers(keyword, "customer", pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("customers", pageResult.getContent());
        response.put("currentPage", pageResult.getNumber());
        response.put("totalPages", pageResult.getTotalPages());
        response.put("totalItems", pageResult.getTotalElements());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}/bookings")
    public ResponseEntity<List<BookingResponse>> getCustomerBookings(@PathVariable Integer userId) {
        List<BookingResponse> bookings = bookingService.getMyBookings(userId);
        return ResponseEntity.ok(bookings);
    }
}
