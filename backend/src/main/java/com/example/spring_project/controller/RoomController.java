package com.example.spring_project.controller;

import com.example.spring_project.entity.Room;
import com.example.spring_project.dto.RoomResponse;
import com.example.spring_project.service.RoomService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getById(@PathVariable Integer roomId) {
        RoomResponse room = roomService.getById(roomId);
        return ResponseEntity.ok(room);
    }

    @GetMapping("/search")
    public ResponseEntity<List<RoomResponse>> search(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDate checkin,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDate checkout,
            @RequestParam(defaultValue = "1") int guests,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice) {
        List<RoomResponse> rooms = roomService.search(
                checkin, checkout, guests, categoryId, minPrice, maxPrice);
        return ResponseEntity.ok(rooms);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RoomResponse> updateRoomStatus(@PathVariable Integer id,
            @RequestBody java.util.Map<String, String> body) {
        String statusName = body.get("status");
        return ResponseEntity.ok(roomService.updateRoomStatus(id, statusName));
    }

    @GetMapping("/statuses")
    public ResponseEntity<java.util.List<com.example.spring_project.entity.RoomStatus>> getAllStatuses() {
        return ResponseEntity.ok(roomService.getAllStatuses());
    }
}
