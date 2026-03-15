package com.example.spring_project.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "maintenance_request")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long id;

    // booking_id NOT NULL in DB
    @JsonIgnore  // Don't serialize full booking; use getRoom() getter instead
    @ManyToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    // user_id NOT NULL in DB
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "authorities", "roles" })
    @JoinColumn(name = "assigned_to", nullable = true)
    private User assignedTo;

    @Column(name = "request_type")
    private String type; // MAINTENANCE, CLEANING

    private String title;

    private String description;

    @Column(name = "photo_url")
    private String itemsImage;

    @Convert(converter = ServiceRequestStatusConverter.class)
    private ServiceRequestStatus status;

    /**
     * Frontend compatibility: expose room info from booking
     */
    @JsonProperty("room")
    public Room getRoom() {
        return booking != null ? booking.getRoom() : null;
    }

    private String priority; // Low, Medium, High, Urgent

    @Column(name = "notes")
    private String resolutionNotes;

    @Column(name = "created_at")
    private LocalDateTime reportedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        reportedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null)
            status = ServiceRequestStatus.New;
        if (priority == null)
            priority = "Low";
        if (title == null && description != null) {
            title = description.length() > 50 ? description.substring(0, 47) + "..." : description;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
