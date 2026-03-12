package com.example.spring_project.service;

import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.User;
import com.example.spring_project.entity.ServiceRequest;
import com.example.spring_project.entity.ServiceRequestStatus;
import com.example.spring_project.entity.ServiceRequestType;
import com.example.spring_project.repository.ServiceRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class ServiceRequestService {

    private final ServiceRequestRepository repository;

    public List<ServiceRequest> getAllRequests() {
        return repository.findAll();
    }

    public Page<ServiceRequest> searchRequests(ServiceRequestStatus status, ServiceRequestType type, String search,
            Pageable pageable) {
        String typeStr = type != null ? type.name() : null;
        return repository.searchRequests(status, typeStr, search, pageable);
    }

    public ServiceRequest createRequest(Booking booking, User requester, Integer roomId, String description,
            ServiceRequestType type, String priority) {

        ServiceRequest request = ServiceRequest.builder()
                .booking(booking)
                .requester(requester)
                .description(description)
                .type(type != null ? type.name() : null)
                .status(ServiceRequestStatus.New)
                .priority(priority != null ? priority : "Low")
                .build();

        return repository.save(request);
    }

    public ServiceRequest updateStatus(Long id, ServiceRequestStatus status, String notes) {
        ServiceRequest request = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        request.setStatus(status);
        if (notes != null) {
            request.setResolutionNotes(notes);
        }
        return repository.save(request);
    }

    public void deleteRequest(Long id) {
        repository.deleteById(id);
    }
}
