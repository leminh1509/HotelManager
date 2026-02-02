package com.example.spring_project.service;

import com.example.spring_project.dto.RoomResponse;
import com.example.spring_project.entity.Room;
import com.example.spring_project.repository.RoomRepository;
import com.example.spring_project.repository.RoomStatusRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomStatusRepository roomStatusRepository;

    public RoomService(RoomRepository roomRepository, RoomStatusRepository roomStatusRepository) {
        this.roomRepository = roomRepository;
        this.roomStatusRepository = roomStatusRepository;
    }

    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public RoomResponse getRoomById(Integer id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found: " + id));
        return toResponse(room);
    }

    public RoomResponse updateRoomStatus(Integer roomId, String statusName) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));

        com.example.spring_project.entity.RoomStatus statusEntity = roomStatusRepository.findAll().stream()
                .filter(s -> s.getName().equalsIgnoreCase(statusName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Status not found: " + statusName));

        room.setStatus(statusEntity);
        room.setUpdatedAt(java.time.LocalDateTime.now());
        Room saved = roomRepository.save(room);
        return toResponse(saved);
    }

    public List<com.example.spring_project.entity.RoomStatus> getAllStatuses() {
        return roomStatusRepository.findAll();
    }

    private RoomResponse toResponse(Room r) {
        RoomResponse dto = new RoomResponse();
        dto.setRoomId(r.getRoomId());
        dto.setRoomNumber(r.getRoomNumber());

        if (r.getCategory() != null) {
            dto.setCategoryId(r.getCategory().getCategoryId());
            dto.setCategoryName(r.getCategory().getName());
        }

        if (r.getStatus() != null) {
            dto.setStatusName(r.getStatus().getName());
        }

        dto.setPrice(r.getPrice());
        dto.setCapacity(r.getCapacity());
        dto.setFloor(r.getFloor());
        dto.setSizem2(r.getSizem2());
        dto.setBedConfiguration(r.getBedConfiguration());
        dto.setCancellationPolicy(r.getCancellationPolicy());
        dto.setDescription(r.getDescription());
        dto.setImgUrl(r.getImgUrl());
        return dto;
    }
}
