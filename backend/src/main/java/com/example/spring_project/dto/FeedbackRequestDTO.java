package com.example.spring_project.dto;

import lombok.Data;

@Data
public class FeedbackRequestDTO {
    private Integer bookingId;
    private Integer rating;
    private String comment;
}
