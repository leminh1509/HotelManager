package com.example.spring_project.controller;

import com.example.spring_project.dto.BookingResponse;
import com.example.spring_project.dto.CustomerDTO;
import com.example.spring_project.repository.BookingRepository;
import com.example.spring_project.service.BookingService;
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

    private final BookingRepository bookingRepo;
    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String idNumber) {

        Pageable pageable = PageRequest.of(page, size);
        
        String n = (name == null || name.isEmpty()) ? null : name;
        String p = (phone == null || phone.isEmpty()) ? null : phone;
        String id = (idNumber == null || idNumber.isEmpty()) ? null : idNumber;

        Page<Object[]> guestPage = bookingRepo.findUniqueGuests(n, p, id, pageable);

        List<CustomerDTO> customers = guestPage.getContent().stream()
                .map(obj -> CustomerDTO.builder()
                        .name((String) obj[0])
                        .email((String) obj[1])
                        .phone((String) obj[2])
                        .idNumber((String) obj[3])
                        .nationality((String) obj[4])
                        .hasActiveBooking(obj[5] != null && ((Number) obj[5]).intValue() == 1)
                        .build())
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("customers", customers);
        response.put("currentPage", guestPage.getNumber());
        response.put("totalPages", guestPage.getTotalPages());
        response.put("totalItems", guestPage.getTotalElements());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getCustomerBookings(
            @RequestParam String name,
            @RequestParam String phone,
            @RequestParam String idNumber) {
        List<BookingResponse> bookings = bookingService.getBookingsByGuest(name, phone, idNumber);
        return ResponseEntity.ok(bookings);
    }
}
