package com.example.spring_project.controller;

import com.example.spring_project.dto.RoomResponse;
import com.example.spring_project.service.RoomService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkin,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkout,
            @RequestParam(defaultValue = "1") int guests,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice) {
        List<RoomResponse> rooms = roomService.search(
                checkin, checkout, guests, categoryId, minPrice, maxPrice);
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/page")
    public ResponseEntity<org.springframework.data.domain.Page<RoomResponse>> getAllRoomsPage(
            @RequestParam(defaultValue = "all", required = false) String status,
            org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(roomService.getAllPage(status, pageable));
    }

    @GetMapping("/search/page")
    public ResponseEntity<org.springframework.data.domain.Page<RoomResponse>> searchPage(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkin,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkout,
            @RequestParam(defaultValue = "1") int guests,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<RoomResponse> rooms = roomService.searchPage(
                checkin, checkout, guests, categoryId, minPrice, maxPrice, pageable);
        return ResponseEntity.ok(rooms);
    }


    @GetMapping("/statuses")
    public ResponseEntity<java.util.List<com.example.spring_project.entity.RoomStatus>> getAllStatuses() {
        return ResponseEntity.ok(roomService.getAllStatuses());
    }
}
