package com.example.spring_project.controller;

import com.example.spring_project.entity.ServiceRequest;
import com.example.spring_project.entity.ServiceRequestStatus;
import com.example.spring_project.entity.ServiceRequestType;
import com.example.spring_project.service.ServiceRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:3000") // Adjust for frontend
public class ServiceRequestController {

    @Autowired
    private ServiceRequestService service;

    @GetMapping
    public List<ServiceRequest> getAllRequests() {
        return service.getAllRequests();
    }

    @PostMapping
    public ServiceRequest createRequest(@RequestBody Map<String, Object> payload) {
        Integer roomId = payload.get("roomId") != null ? Integer.valueOf(payload.get("roomId").toString()) : null;
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
