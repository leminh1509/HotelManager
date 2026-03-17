package com.example.spring_project.repository;

import com.example.spring_project.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Integer> {
    List<Feedback> findByRoom_RoomIdOrderByCreatedAtDesc(Integer roomId);

    Optional<Feedback> findByBooking_BookingId(Integer bookingId);
}
