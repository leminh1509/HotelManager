package com.example.spring_project.controller;

import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.User;
import com.example.spring_project.entity.ServiceRequest;
import com.example.spring_project.entity.ServiceRequestStatus;
import com.example.spring_project.entity.ServiceRequestType;
import com.example.spring_project.repository.BookingRepository;
import com.example.spring_project.repository.UserRepository;
import com.example.spring_project.service.ServiceRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:3000")
public class ServiceRequestController {

    @Autowired
    private ServiceRequestService service;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/search")
    public Page<ServiceRequest> searchRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        ServiceRequestStatus statusEnum = status != null && !status.isEmpty()
                ? ServiceRequestStatus.fromValue(status)
                : null;
        ServiceRequestType typeEnum = type != null && !type.isEmpty() ? ServiceRequestType.valueOf(type) : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by("reportedAt").descending());
        return service.searchRequests(statusEnum, typeEnum, search, pageable);
    }

    @GetMapping
    public List<ServiceRequest> getAllRequests() {
        return service.getAllRequests();
    }

    @GetMapping("/cleaning")
    public Page<ServiceRequest> getCleaningRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        ServiceRequestStatus statusEnum = status != null && !status.isEmpty()
                ? ServiceRequestStatus.fromValue(status)
                : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by("reportedAt").descending());
        return service.searchRequests(statusEnum, ServiceRequestType.CLEANING, search, pageable);
    }

    @PostMapping("/cleaning")
    public ServiceRequest createCleaningRequest(@RequestBody Map<String, Object> payload) {
        payload.put("type", "CLEANING");
        return createRequest(payload);
    }

    @GetMapping("/maintenance")
    public Page<ServiceRequest> getMaintenanceRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        ServiceRequestStatus statusEnum = status != null && !status.isEmpty()
                ? ServiceRequestStatus.fromValue(status)
                : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by("reportedAt").descending());
        // Pass null as type to return ALL requests (Maintenance + Cleaning)
        return service.searchRequests(statusEnum, null, search, pageable);
    }

    @PostMapping("/maintenance")
    public ServiceRequest createMaintenanceRequest(@RequestBody Map<String, Object> payload) {
        payload.put("type", "MAINTENANCE");
        return createRequest(payload);
    }

    @PostMapping
    public ServiceRequest createRequest(@RequestBody Map<String, Object> payload) {
        Object roomIdObj = payload.get("roomId");
        Integer roomId = null;
        if (roomIdObj != null && !roomIdObj.toString().trim().isEmpty()) {
            try {
                roomId = Integer.valueOf(roomIdObj.toString());
            } catch (NumberFormatException e) {
                roomId = null;
            }
        }

        // 1. Get current logged-in user (Receptionist/Admin)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = null;
        if (auth != null) {
            currentUser = userRepository.findByEmail(auth.getName()).orElse(null);
        }
        if (currentUser == null) {
            throw new RuntimeException("Phải đăng nhập mới có thể tạo yêu cầu");
        }

        // 2. Find associated booking for this room (if roomId provided)
        Booking booking = null;
        if (roomId != null) {
            booking = bookingRepository.findByRoomRoomIdAndStatus(roomId, Booking.Status.CheckedIn)
                    .stream().findFirst().orElse(null);

            if (booking == null) {
                booking = bookingRepository.findByRoomRoomIdAndStatus(roomId, Booking.Status.Confirmed)
                        .stream().findFirst().orElse(null);
            }
        }

        if (booking == null) {
            throw new RuntimeException("Yêu cầu bảo trì/dọn dẹp phải liên kết với một Booking đang hoạt động tại phòng này.");
        }

        String description = (String) payload.get("description");
        String typeStr = (String) payload.get("type");
        String priority = (String) payload.get("priority");

        ServiceRequestType type = ServiceRequestType.valueOf(typeStr);
        return service.createRequest(booking, currentUser, roomId, description, type, priority);
    }

    @PutMapping("/{id}/status")
    public ServiceRequest updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String statusStr = payload.get("status");
        String notes = payload.get("notes");
        ServiceRequestStatus status = ServiceRequestStatus.fromValue(statusStr);
        return service.updateStatus(id, status, notes);
    }

    @DeleteMapping("/{id}")
    public void deleteRequest(@PathVariable Long id) {
        service.deleteRequest(id);
    }
}
