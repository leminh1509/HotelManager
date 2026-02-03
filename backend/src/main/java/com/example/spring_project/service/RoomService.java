package com.example.spring_project.service;



import com.example.spring_project.dto.RoomResponse;
import com.example.spring_project.entity.Room;
import com.example.spring_project.exception.ResourceNotFoundException;
import com.example.spring_project.repository.RoomRepository;
import com.example.spring_project.util.BookingMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    // ─────────────────────────────────────────────────────
    // Lấy 1 phòng theo ID
    // ─────────────────────────────────────────────────────
    public RoomResponse getById(Integer roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + roomId));
        return BookingMapper.toRoomResponse(room);
    }

    // ─────────────────────────────────────────────────────
    // Tìm phòng trống (search)
    // ─────────────────────────────────────────────────────
    public List<RoomResponse> search(
            LocalDateTime checkin,
            LocalDateTime checkout,
            int guestCount,
            Integer categoryId,
            Double minPrice,
            Double maxPrice
    ) {
        List<Room> rooms = roomRepository.findAvailableRoomsFiltered(
                checkin, checkout, guestCount, categoryId, minPrice, maxPrice
        );

        return rooms.stream()
                .map(BookingMapper::toRoomResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────
    // Lấy entity thô (dùng nội bộ trong BookingService)
    // ─────────────────────────────────────────────────────
    public Room getEntityById(Integer roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + roomId));
    }
}