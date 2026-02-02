package com.example.spring_project.service;

import com.example.spring_project.dto.RoomResponse;
import com.example.spring_project.entity.Room;
import com.example.spring_project.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
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
