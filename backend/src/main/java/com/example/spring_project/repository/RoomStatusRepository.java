package com.example.spring_project.repository;

import com.example.spring_project.entity.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomStatusRepository extends JpaRepository<RoomStatus, Integer> {
    // Basic CRUD is enough
}
