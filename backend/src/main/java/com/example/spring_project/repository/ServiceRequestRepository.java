package com.example.spring_project.repository;

import com.example.spring_project.entity.ServiceRequest;
import com.example.spring_project.entity.ServiceRequestStatus;
import com.example.spring_project.entity.ServiceRequestType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
        List<ServiceRequest> findByStatus(ServiceRequestStatus status);

        List<ServiceRequest> findByType(ServiceRequestType type);

        List<ServiceRequest> findByRoom_RoomId(Integer roomId); // Updated generic ID to Integer if needed, or derived
                                                                // query
                                                                // works

        @Query("SELECT r FROM ServiceRequest r " +
                        "LEFT JOIN r.room rm " +
                        "WHERE " +
                        "(:status IS NULL OR r.status = :status) AND " +
                        "(:type IS NULL OR r.type = :type) AND " +
                        "(:search IS NULL OR LOWER(r.description) LIKE LOWER(CONCAT('%', :search, '%')) OR (rm.roomNumber IS NOT NULL AND LOWER(rm.roomNumber) LIKE LOWER(CONCAT('%', :search, '%'))))")
        Page<ServiceRequest> searchRequests(@Param("status") ServiceRequestStatus status,
                        @Param("type") ServiceRequestType type,
                        @Param("search") String search,
                        Pageable pageable);

        /**
         * Count non-completed tasks assigned to a specific staff member.
         * Used for load-balanced assignment during auto-checkout.
         */
        @Query("SELECT COUNT(r) FROM ServiceRequest r WHERE r.assignedTo.userId = :userId AND r.status <> 'COMPLETED'")
        long countActiveTasksByUser(@Param("userId") Integer userId);
}
