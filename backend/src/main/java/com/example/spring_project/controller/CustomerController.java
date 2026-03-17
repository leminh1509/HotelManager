package com.example.spring_project.controller;

import com.example.spring_project.dto.BookingResponse;
import com.example.spring_project.dto.UserResponse;
import com.example.spring_project.service.BookingService;
import com.example.spring_project.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/receptionist/customers")
@PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
@RequiredArgsConstructor
public class CustomerController {

    private final UserManagementService userService;
    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllCustomers() {
        List<UserResponse> customers = userService.getUsersByRoleValidated("customer");
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/{userId}/bookings")
    public ResponseEntity<List<BookingResponse>> getCustomerBookings(@PathVariable Integer userId) {
        List<BookingResponse> bookings = bookingService.getMyBookings(userId);
        return ResponseEntity.ok(bookings);
    }
}
