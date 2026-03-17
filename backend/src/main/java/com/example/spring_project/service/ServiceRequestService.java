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
    private final com.example.spring_project.repository.UserRepository userRepo;

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

        // Auto-assign to least busy staff if it's a cleaning request or if assignedTo
        // is null
        User assignee = findLeastBusyStaff("maintenance");

        ServiceRequest request = ServiceRequest.builder()
                .booking(booking)
                .requester(requester)
                .assignedTo(assignee)
                .description(description)
                .type(type != null ? type.name() : null)
                .status(ServiceRequestStatus.New)
                .priority(priority != null ? priority : "Low")
                .build();

        return repository.save(request);
    }

    /**
     * Finds the staff member with the specified role who has the fewest active
     * tasks.
     */
    private User findLeastBusyStaff(String roleName) {
        List<User> staffMembers = userRepo.findByRole_Name(roleName);
        if (staffMembers == null || staffMembers.isEmpty()) {
            return null;
        }

        User leastBusy = null;
        long minTasks = Long.MAX_VALUE;

        for (User staff : staffMembers) {
            long activeTasks = repository.countActiveTasksByUser(staff.getUserId());
            if (activeTasks < minTasks) {
                minTasks = activeTasks;
                leastBusy = staff;
            }
        }
        return leastBusy;
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
