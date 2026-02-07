package com.example.spring_project.controller;

import com.example.spring_project.entity.ServiceRequest;
import com.example.spring_project.entity.ServiceRequestStatus;
import com.example.spring_project.entity.ServiceRequestType;
import com.example.spring_project.service.ServiceRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:3000") // Adjust for frontend
public class ServiceRequestController {

    @Autowired
    private ServiceRequestService service;

    @GetMapping("/search")
    public Page<ServiceRequest> searchRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        ServiceRequestStatus statusEnum = status != null && !status.isEmpty() ? ServiceRequestStatus.valueOf(status)
                : null;
        ServiceRequestType typeEnum = type != null && !type.isEmpty() ? ServiceRequestType.valueOf(type) : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by("reportedAt").descending());
        return service.searchRequests(statusEnum, typeEnum, search, pageable);
    }

    @GetMapping
    public List<ServiceRequest> getAllRequests() {
        return service.getAllRequests();
    }

    @PostMapping
    public ServiceRequest createRequest(@RequestBody Map<String, Object> payload) {
        Object roomIdObj = payload.get("roomId");
        Integer roomId = null;
        if (roomIdObj != null && !roomIdObj.toString().trim().isEmpty()) {
            try {
                roomId = Integer.valueOf(roomIdObj.toString());
            } catch (NumberFormatException e) {
                roomId = null; // Fallback to null (general/lobby) if invalid
            }
        }
        String description = (String) payload.get("description");
        String typeStr = (String) payload.get("type");
        String priority = (String) payload.get("priority");

        ServiceRequestType type = ServiceRequestType.valueOf(typeStr);
        return service.createRequest(roomId, description, type, priority);
    }

    @PutMapping("/{id}/status")
    public ServiceRequest updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String statusStr = payload.get("status");
        String notes = payload.get("notes");
        ServiceRequestStatus status = ServiceRequestStatus.valueOf(statusStr);
        return service.updateStatus(id, status, notes);
    }

    @DeleteMapping("/{id}")
    public void deleteRequest(@PathVariable Long id) {
        service.deleteRequest(id);
    }
}
