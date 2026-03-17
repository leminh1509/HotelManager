package com.example.spring_project.controller;

import com.example.spring_project.dto.FeedbackRequestDTO;
import com.example.spring_project.dto.FeedbackResponseDTO;
import com.example.spring_project.entity.User;
import com.example.spring_project.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedbacks")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<FeedbackResponseDTO> submitFeedback(
            @RequestBody FeedbackRequestDTO request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(feedbackService.submitFeedback(request, currentUser));
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<FeedbackResponseDTO>> getRoomFeedbacks(@PathVariable Integer roomId) {
        return ResponseEntity.ok(feedbackService.getFeedbacksByRoom(roomId));
    }
}
