package com.example.spring_project.service;

import com.example.spring_project.dto.FeedbackRequestDTO;
import com.example.spring_project.dto.FeedbackResponseDTO;
import com.example.spring_project.entity.User;

import java.util.List;

public interface FeedbackService {
    FeedbackResponseDTO submitFeedback(FeedbackRequestDTO request, User currentUser);

    List<FeedbackResponseDTO> getFeedbacksByRoom(Integer roomId);
}
