package com.example.spring_project.service;

import com.example.spring_project.entity.Room;
import com.example.spring_project.entity.ServiceRequest;
import com.example.spring_project.entity.ServiceRequestStatus;
import com.example.spring_project.entity.ServiceRequestType;
import com.example.spring_project.repository.RoomRepository;
import com.example.spring_project.repository.ServiceRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServiceRequestService {

    @Autowired
    private ServiceRequestRepository repository;

    @Autowired
    private RoomRepository roomRepository;

    public List<ServiceRequest> getAllRequests() {
        return repository.findAll();
    }

    public List<ServiceRequest> getRequestsByStatus(ServiceRequestStatus status) {
        return repository.findByStatus(status);
    }

    public ServiceRequest createRequest(Integer roomId, String description, ServiceRequestType type, String priority) {
        Room room = null;
        if (roomId != null) {
            room = roomRepository.findById(roomId).orElseThrow(() -> new RuntimeException("Room not found"));
        }

        ServiceRequest request = ServiceRequest.builder()
                .room(room)
                .description(description)
                .type(type)
                .status(ServiceRequestStatus.PENDING)
                .priority(priority != null ? priority : "MEDIUM")
                .build();

        return repository.save(request);
    }

    public ServiceRequest updateStatus(Long id, ServiceRequestStatus status, String notes) {
        ServiceRequest request = repository.findById(id).orElseThrow(() -> new RuntimeException("Request not found"));
        request.setStatus(status);
        if (notes != null && !notes.isEmpty()) {
            request.setResolutionNotes(notes);
        }
        return repository.save(request);
    }

    public void deleteRequest(Long id) {
        repository.deleteById(id);
    }
}
