package com.example.spring_project.util;

import com.example.spring_project.dto.BookingResponse;
import com.example.spring_project.dto.RoomResponse;
import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.Room;

/**
 * Utility class chuyển đổi Entity → DTO.
 * Tách ra đây để Service không phải care logic mapping.
 */
public class BookingMapper {

    private BookingMapper() {
    } // no-instance

    // ─────────────────────────────────────────────────────
    // Room → RoomResponse
    // ─────────────────────────────────────────────────────
    public static RoomResponse toRoomResponse(Room room) {
        RoomResponse dto = new RoomResponse();

        dto.setRoomId(room.getRoomId());
        dto.setRoomNumber(room.getRoomNumber());
        dto.setPrice(room.getPrice());
        dto.setCapacity(room.getCapacity());
        dto.setFloor(room.getFloor());
        dto.setSizem2(room.getSizem2());
        dto.setBedConfiguration(room.getBedConfiguration());
        dto.setCancellationPolicy(room.getCancellationPolicy());
        dto.setDescription(room.getDescription());
        dto.setImgUrl(room.getImgUrl());

        if (room.getCategory() != null) {
            dto.setCategoryId(room.getCategory().getCategoryId());
            dto.setCategoryName(room.getCategory().getName());
        }
        if (room.getStatus() != null) {
            dto.setStatusName(room.getStatus().getName());
        }

        return dto;
    }

    // ─────────────────────────────────────────────────────
    // Booking → BookingResponse
    // ─────────────────────────────────────────────────────
    public static com.example.spring_project.dto.CategoryResponse toCategoryResponse(
            com.example.spring_project.entity.Category category) {
        com.example.spring_project.dto.CategoryResponse dto = new com.example.spring_project.dto.CategoryResponse();
        dto.setCategoryId(category.getCategoryId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setImgUrl(category.getImgUrl());
        return dto;
    }

    public static BookingResponse toBookingResponse(Booking booking) {
        BookingResponse dto = new BookingResponse();

        dto.setBookingId(booking.getBookingId());
        dto.setStatus(booking.getStatus().getDbValue());
        dto.setTotalPrice(booking.getTotalPrice());

        dto.setGuestName(booking.getGuestName());
        dto.setGuestEmail(booking.getGuestEmail());
        dto.setGuestPhone(booking.getGuestPhone());
        dto.setGuestIdNumber(booking.getGuestIdNumber());
        dto.setGuestNationality(booking.getGuestNationality());
        dto.setGuestCount(booking.getGuestCount());
        dto.setSpecialRequest(booking.getSpecialRequest());
        dto.setEarlyCheckin(booking.getEarlyCheckin());
        dto.setLateCheckout(booking.getLateCheckout());

        dto.setCheckinTime(booking.getCheckinTime());
        dto.setCheckoutTime(booking.getCheckoutTime());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setUpdatedAt(booking.getUpdatedAt());

        // ── nested: room ──
        Room room = booking.getRoom();
        if (room != null) {
            dto.setRoomId(room.getRoomId());
            dto.setRoomNumber(room.getRoomNumber());
            dto.setRoomPrice(room.getPrice());
            dto.setRoomCapacity(room.getCapacity());
            dto.setRoomImgUrl(room.getImgUrl());

            if (room.getCategory() != null) {
                dto.setRoomName(room.getCategory().getName());
            }
        }

        // ── nested: user (guest) ──
        if (booking.getUser() != null) {
            dto.setUserId(booking.getUser().getUserId());
            dto.setUserEmail(booking.getUser().getEmail());
        }

        // ── nested: receptionist (staff - using existing receptionist_id) ──
        if (booking.getReceptionist() != null) {
            dto.setReceptionistName(booking.getReceptionist().getFullName());
        }

        return dto;
    }
}
