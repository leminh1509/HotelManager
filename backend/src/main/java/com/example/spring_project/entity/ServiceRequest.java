package com.example.spring_project.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "maintenance_request")
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = true) // Nullable if it's a general facility request
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to", nullable = true)
    private User assignedTo;

    // e.g., "Air conditioner broken", "Need fresh towels"
    private String description;

    @Enumerated(EnumType.STRING)
    private ServiceRequestType type;

    @Enumerated(EnumType.STRING)
    private ServiceRequestStatus status;

    private String priority; // LIGHT, MEDIUM, HIGH, URGENT

    @Column(name = "items_image")
    private String itemsImage; // Optional image URL

    @Column(name = "reported_at")
    private LocalDateTime reportedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Notes added by maintenance staff
    @Column(name = "resolution_notes")
    private String resolutionNotes;

    @PrePersist
    protected void onCreate() {
        reportedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null)
            status = ServiceRequestStatus.PENDING;
        if (priority == null)
            priority = "MEDIUM";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
