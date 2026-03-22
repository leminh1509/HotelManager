package com.example.spring_project.service;

import com.example.spring_project.dto.RoomResponse;
import com.example.spring_project.entity.Room;
import com.example.spring_project.exception.ResourceNotFoundException;
import com.example.spring_project.repository.RoomRepository;
import com.example.spring_project.util.BookingMapper;

import jakarta.persistence.criteria.CriteriaBuilder.In;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class RoomService {

    private final RoomRepository roomRepository;
    private final com.example.spring_project.repository.RoomStatusRepository roomStatusRepository;

    public RoomService(RoomRepository roomRepository,
            com.example.spring_project.repository.RoomStatusRepository roomStatusRepository) {
        this.roomRepository = roomRepository;
        this.roomStatusRepository = roomStatusRepository;
    }

    public void updateStatus(Integer roomId, Integer statusId) {
        int updated = roomRepository.updateRoomStatus(roomId, statusId);
        if (updated == 0) {
            throw new ResourceNotFoundException("Room not found with id: " + roomId);
        }
    }

    public List<RoomResponse> getAll() {
        return roomRepository.findAll()
                .stream()
                .map(BookingMapper::toRoomResponse)
                .collect(Collectors.toList());
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
            Double maxPrice) {
        List<Room> rooms = roomRepository.findAvailableRoomsFiltered(
                checkin, checkout, guestCount, categoryId, minPrice, maxPrice);

        return rooms.stream()
                .map(BookingMapper::toRoomResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────
    // Lấy entity thô (dùng nội bộ trong BookingService)
    // ─────────────────────────────────────────────────────

    public org.springframework.data.domain.Page<RoomResponse> searchPage(
            LocalDateTime checkin,
            LocalDateTime checkout,
            int guestCount,
            Integer categoryId,
            Double minPrice,
            Double maxPrice,
            org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Room> rooms = roomRepository.findAvailableRoomsFilteredPage(
                checkin, checkout, guestCount, categoryId, minPrice, maxPrice, pageable);

        return rooms.map(BookingMapper::toRoomResponse);
    }

    public org.springframework.data.domain.Page<RoomResponse> getAllPage(
            String statusFilter,
            org.springframework.data.domain.Pageable pageable) {
        if (statusFilter == null || statusFilter.equalsIgnoreCase("all") || statusFilter.isEmpty()) {
            return roomRepository.findAll(pageable)
                    .map(BookingMapper::toRoomResponse);
        }
        return roomRepository.findRoomsByStatusPage(statusFilter, pageable)
                .map(BookingMapper::toRoomResponse);
    }

    public Room getEntityById(Integer roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + roomId));
    }

    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(BookingMapper::toRoomResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoomResponse updateRoomStatus(Integer roomId, String statusName) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        com.example.spring_project.entity.RoomStatus statusEntity = roomStatusRepository.findAll().stream()
                .filter(s -> s.getName().equalsIgnoreCase(statusName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Status not found: " + statusName));

        room.setStatus(statusEntity);
        Room saved = roomRepository.save(room);
        return BookingMapper.toRoomResponse(saved);
    }

    public List<com.example.spring_project.entity.RoomStatus> getAllStatuses() {
        return roomStatusRepository.findAll();
    }
}
