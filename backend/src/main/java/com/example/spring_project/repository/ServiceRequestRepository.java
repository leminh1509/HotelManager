package com.example.spring_project.repository;

import com.example.spring_project.entity.ServiceRequest;
import com.example.spring_project.entity.ServiceRequestStatus;
import com.example.spring_project.entity.ServiceRequestType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    List<ServiceRequest> findByStatus(ServiceRequestStatus status);

    List<ServiceRequest> findByType(ServiceRequestType type);

    List<ServiceRequest> findByRoom_RoomId(Long roomId); // Assuming Room has roomId
}
