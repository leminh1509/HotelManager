package com.example.spring_project.service;

import com.example.spring_project.dto.BookingCreateRequest;
import com.example.spring_project.dto.BookingResponse;
import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.Booking.Status;
import com.example.spring_project.entity.Room;
import com.example.spring_project.entity.User;
import com.example.spring_project.repository.BookingRepository;
import com.example.spring_project.repository.RoomRepository;
import com.example.spring_project.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public BookingService(BookingRepository bookingRepository, RoomRepository roomRepository,
            UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BookingResponse create(BookingCreateRequest request, Integer userId) {
        // 1. Validate info
        if (request.getCheckinTime().isAfter(request.getCheckoutTime())) {
            throw new IllegalArgumentException("Check-in time must be before check-out time");
        }

        // 2. Validate availability
        // If > 0 overlapping bookings not cancelled => room busy
        Long overlapping = bookingRepository.countOverlapping(
                request.getRoomId(),
                request.getCheckinTime(),
                request.getCheckoutTime(),
                Status.Cancelled);
        if (overlapping > 0) {
            throw new RuntimeException("Room is not available for the selected dates");
        }

        // 3. Fetch dependencies
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        // 4. Create entity
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setRoom(room);

        // Map fields
        booking.setGuestName(request.getGuestName());
        booking.setGuestEmail(request.getGuestEmail());
        booking.setGuestPhone(request.getGuestPhone());
        booking.setGuestIdNumber(request.getGuestIdNumber());
        booking.setGuestNationality(request.getGuestNationality());
        booking.setGuestAddress(request.getGuestAddress());
        booking.setGuestCount(request.getGuestCount());
        booking.setSpecialRequest(request.getSpecialRequest());

        booking.setEarlyCheckin(request.getEarlyCheckin() != null ? request.getEarlyCheckin() : false);
        booking.setLateCheckout(request.getLateCheckout() != null ? request.getLateCheckout() : false);

        booking.setCheckinTime(request.getCheckinTime());
        booking.setCheckoutTime(request.getCheckoutTime());
        booking.setStatus(Status.Pending); // Default

        // Calc price (simple logic: price * nights)
        long nights = ChronoUnit.DAYS.between(request.getCheckinTime(), request.getCheckoutTime());
        if (nights < 1)
            nights = 1;
        double total = room.getPrice().doubleValue() * nights;
        booking.setTotalPrice(total);

        booking.setCreatedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());

        // 5. Save
        Booking saved = bookingRepository.save(booking);

        // 6. Map response
        return mapToResponse(saved);
    }

    // ─────────────────────────────────────────────────────
    // GET BY ID
    // ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public BookingResponse getById(Integer bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId);
        if (booking == null) {
            // Try standard find if custom query returns null or just in case
            booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
        }
        return mapToResponse(booking);
    }

    // ─────────────────────────────────────────────────────
    // GET MY BOOKINGS
    // ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(Integer userId) {
        List<Booking> list = bookingRepository.findByUserId(userId);
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────
    // CANCEL
    // ─────────────────────────────────────────────────────
    @Transactional
    public BookingResponse cancel(Integer bookingId, Integer userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        User requester = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isOwner = booking.getUser().getUserId().equals(userId);
        boolean isAdminOrReceptionist = requester.getRole().getName().equalsIgnoreCase("ADMIN")
                || requester.getRole().getName().equalsIgnoreCase("RECEPTIONIST");

        if (!isOwner && !isAdminOrReceptionist) {
            throw new RuntimeException("Access denied");
        }

        if (booking.getStatus() == Status.Cancelled) {
            throw new RuntimeException("Booking is already cancelled");
        }

        booking.setStatus(Status.Cancelled);
        booking.setUpdatedAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        List<Booking> list = bookingRepository.findAll();
        return list.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse updateStatus(Integer bookingId, String statusStr) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        Status newStatus;
        try {
            newStatus = Status.fromString(statusStr);
        } catch (Exception e) {
            try {
                newStatus = Status.valueOf(statusStr);
            } catch (IllegalArgumentException ex) {
                throw new RuntimeException("Invalid status: " + statusStr);
            }
        }

        booking.setStatus(newStatus);
        booking.setUpdatedAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    private BookingResponse mapToResponse(Booking b) {
        BookingResponse res = new BookingResponse();
        res.setBookingId(b.getBookingId());
        res.setStatus(b.getStatus().name());
        res.setTotalPrice(b.getTotalPrice());

        // Room
        if (b.getRoom() != null) {
            res.setRoomId(b.getRoom().getRoomId());
            res.setRoomNumber(b.getRoom().getRoomNumber());
            res.setRoomPrice(b.getRoom().getPrice().doubleValue());
            res.setRoomCapacity(b.getRoom().getCapacity());
            // Safe check for category
            if (b.getRoom().getCategory() != null) {
                res.setRoomName(b.getRoom().getCategory().getName());
            }
            res.setRoomImgUrl(b.getRoom().getImgUrl());
        }

        // Guest
        res.setGuestName(b.getGuestName());
        res.setGuestEmail(b.getGuestEmail());
        res.setGuestPhone(b.getGuestPhone());
        res.setGuestIdNumber(b.getGuestIdNumber());
        res.setGuestNationality(b.getGuestNationality());
        res.setGuestAddress(b.getGuestAddress());
        res.setGuestCount(b.getGuestCount());
        res.setSpecialRequest(b.getSpecialRequest());
        res.setEarlyCheckin(b.getEarlyCheckin());
        res.setLateCheckout(b.getLateCheckout());

        // Dates
        res.setCheckinTime(b.getCheckinTime());
        res.setCheckoutTime(b.getCheckoutTime());
        res.setCreatedAt(b.getCreatedAt());
        res.setUpdatedAt(b.getUpdatedAt());

        // User
        if (b.getUser() != null) {
            res.setUserId(b.getUser().getUserId());
            res.setUserEmail(b.getUser().getEmail());
        }

        return res;
    }
}
