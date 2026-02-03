package com.example.spring_project.controller;

import com.example.spring_project.dto.RoomResponse;
import com.example.spring_project.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> getRoomById(@PathVariable Integer id) {
        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/{id}/status")
    public ResponseEntity<RoomResponse> updateRoomStatus(@PathVariable Integer id,
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, String> body) {
        String statusName = body.get("status");
        return ResponseEntity.ok(roomService.updateRoomStatus(id, statusName));
    }

    @GetMapping("/statuses")
    public ResponseEntity<java.util.List<com.example.spring_project.entity.RoomStatus>> getAllStatuses() {
        return ResponseEntity.ok(roomService.getAllStatuses());
    }
}
