package com.example.spring_project.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "service_requests")
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = true) // Nullable if it's a general facility request
    private Room room;

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
