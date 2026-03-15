package com.example.spring_project.repository;

import com.example.spring_project.entity.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomStatusRepository extends JpaRepository<RoomStatus, Integer> {
    Optional<RoomStatus> findByName(String name);
}
