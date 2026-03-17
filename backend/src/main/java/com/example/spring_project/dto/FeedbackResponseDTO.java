package com.example.spring_project.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FeedbackResponseDTO {
    private Integer feedbackId;
    private Integer userId;
    private String userFullName;
    private String userAvatarUrl;
    private Integer roomId;
    private Integer bookingId;
    private Integer rating;
    private String comment;
    private java.util.List<String> imageUrls;
    private LocalDateTime createdAt;
}
