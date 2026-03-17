package com.example.spring_project.service.impl;

import com.example.spring_project.dto.FeedbackRequestDTO;
import com.example.spring_project.dto.FeedbackResponseDTO;
import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.Feedback;
import com.example.spring_project.entity.User;
import com.example.spring_project.repository.BookingRepository;
import com.example.spring_project.repository.FeedbackRepository;
import com.example.spring_project.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeedbackServiceImpl implements FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Override
    @Transactional
    public FeedbackResponseDTO submitFeedback(FeedbackRequestDTO request, User currentUser) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Validate user and booking status
        if (!booking.getUser().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("You can only leave feedback for your own bookings");
        }
        if (booking.getStatus() != Booking.Status.CheckedOut) {
            throw new RuntimeException("You can only leave feedback after checking out");
        }

        // Check if feedback already exists
        if (feedbackRepository.findByBooking_BookingId(booking.getBookingId()).isPresent()) {
            throw new RuntimeException("Feedback already submitted for this booking");
        }

        Feedback feedback = new Feedback();
        feedback.setBooking(booking);
        feedback.setRoom(booking.getRoom());
        feedback.setUser(currentUser);
        feedback.setRating(request.getRating());
        feedback.setComment(request.getComment());

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            feedback.setImageUrls(String.join(",", request.getImageUrls()));
        }

        feedback = feedbackRepository.save(feedback);
        return mapToDTO(feedback);
    }

    @Override
    public List<FeedbackResponseDTO> getFeedbacksByRoom(Integer roomId) {
        return feedbackRepository.findByRoom_RoomIdOrderByCreatedAtDesc(roomId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.collectingAndThen(Collectors.toList(), list -> list));
    }

    private FeedbackResponseDTO mapToDTO(Feedback feedback) {
        FeedbackResponseDTO dto = new FeedbackResponseDTO();
        dto.setFeedbackId(feedback.getFeedbackId());
        dto.setUserId(feedback.getUser().getUserId());
        dto.setUserFullName(feedback.getUser().getFullName());
        dto.setUserAvatarUrl(feedback.getUser().getAvatarUrl());
        dto.setRoomId(feedback.getRoom().getRoomId());
        dto.setBookingId(feedback.getBooking().getBookingId());
        dto.setRating(feedback.getRating());
        dto.setComment(feedback.getComment());

        if (feedback.getImageUrls() != null && !feedback.getImageUrls().isEmpty()) {
            dto.setImageUrls(java.util.Arrays.asList(feedback.getImageUrls().split(",")));
        } else {
            dto.setImageUrls(java.util.Collections.emptyList());
        }

        dto.setCreatedAt(feedback.getCreatedAt());
        return dto;
    }
}
