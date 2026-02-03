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

    // ─────────────────────────────────────────────────────
    // GET /api/rooms/{roomId}
    // Lấy chi tiết 1 phòng (cho trang RoomDetail)
    // ─────────────────────────────────────────────────────
    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getById(@PathVariable Integer roomId) {
        RoomResponse room = roomService.getById(roomId);
        return ResponseEntity.ok(room);
    }

    // ─────────────────────────────────────────────────────
    // GET /api/rooms/search
    //   ?checkin=2026-02-10T14:00:00
    //   &checkout=2026-02-12T11:00:00
    //   &guests=2
    //   &categoryId=1          (optional)
    //   &minPrice=1000000      (optional)
    //   &maxPrice=5000000      (optional)
    //
    // Frontend gửi checkin/checkout dạng ISO LocalDateTime.
    // ─────────────────────────────────────────────────────
    @GetMapping("/search")
    public ResponseEntity<List<RoomResponse>> search(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkin,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkout,
            @RequestParam(defaultValue = "1") int guests,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice
    ) {
        List<RoomResponse> rooms = roomService.search(
                checkin, checkout, guests, categoryId, minPrice, maxPrice
        );
        return ResponseEntity.ok(rooms);
    }
}