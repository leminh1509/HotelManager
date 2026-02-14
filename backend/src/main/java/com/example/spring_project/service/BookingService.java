package com.example.spring_project.service;

import com.example.spring_project.dto.BookingCreateRequest;
import com.example.spring_project.dto.BookingResponse;
import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.Booking.Status;
import com.example.spring_project.entity.Room;
import com.example.spring_project.entity.User;
import com.example.spring_project.exception.ConflictException;
import com.example.spring_project.exception.ResourceNotFoundException;
import com.example.spring_project.repository.BookingRepository;
import com.example.spring_project.repository.UserRepository;
import com.example.spring_project.util.BookingMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepo;
    private final RoomService roomService;
    private final UserRepository userRepo;

    public BookingService(BookingRepository bookingRepo,
            RoomService roomService,
            UserRepository userRepo) {
        this.bookingRepo = bookingRepo;
        this.roomService = roomService;
        this.userRepo = userRepo;
    }

    // ─────────────────────────────────────────────────────
    // Tạo booking mới
    // ─────────────────────────────────────────────────────
    @Transactional
    public BookingResponse create(BookingCreateRequest req, Integer userId) {

        // 1) load user (caller — đã auth)
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // 2) load room (validate tồn tại)
        Room room = roomService.getEntityById(req.getRoomId());
        roomService.updateStatus(req.getRoomId(), 2);

        // 3) validate capacity
        if (req.getGuestCount() > room.getCapacity()) {
            throw new ConflictException(
                    "Room capacity is " + room.getCapacity() + ", but requested " + req.getGuestCount() + " guests");
        }

        // 4) validate dates
        if (!req.getCheckinTime().isBefore(req.getCheckoutTime())) {
            throw new ConflictException("checkinTime must be before checkoutTime");
        }

        // 5) check overlap — phòng đã bị đặt trong khoảng time chưa?
        long overlap = bookingRepo.countOverlapping(
                room.getRoomId(),
                req.getCheckinTime(),
                req.getCheckoutTime(),
                Status.Cancelled // trừ các booking đã hủy
        );
        if (overlap > 0) {
            throw new ConflictException("Room is not available for the selected dates");
        }

        // 6) tính giá: price × số đêm
        long nights = ChronoUnit.DAYS.between(
                req.getCheckinTime(),
                req.getCheckoutTime());
        double totalPrice = room.getPrice() * Math.max(nights, 1);

        // 7) build entity
        LocalDateTime now = LocalDateTime.now();

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setRoom(room);
        booking.setGuestName(req.getGuestName());
        booking.setGuestEmail(req.getGuestEmail());
        booking.setGuestPhone(req.getGuestPhone());
        booking.setGuestIdNumber(req.getGuestIdNumber());
        booking.setGuestNationality(req.getGuestNationality());
        booking.setGuestAddress(req.getGuestAddress());
        booking.setGuestCount(req.getGuestCount());
        booking.setSpecialRequest(req.getSpecialRequest());
        booking.setEarlyCheckin(req.getEarlyCheckin() != null && req.getEarlyCheckin());
        booking.setLateCheckout(req.getLateCheckout() != null && req.getLateCheckout());
        booking.setCheckinTime(req.getCheckinTime());
        booking.setCheckoutTime(req.getCheckoutTime());
        booking.setStatus(Status.Pending);
        booking.setTotalPrice(totalPrice);
        booking.setCreatedAt(now);
        booking.setUpdatedAt(now);

        // 8) save
        Booking saved = bookingRepo.save(booking);

        return BookingMapper.toBookingResponse(saved);
    }

    // ─────────────────────────────────────────────────────
    // Lấy booking theo ID
    // ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public BookingResponse getById(Integer bookingId) {
        Booking booking = bookingRepo.findByIdWithDetails(bookingId);
        if (booking == null) {
            throw new ResourceNotFoundException("Booking not found with id: " + bookingId);
        }
        return BookingMapper.toBookingResponse(booking);
    }

    // ─────────────────────────────────────────────────────
    // Lấy tất cả bookings của user đang login
    // ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(Integer userId) {
        List<Booking> bookings = bookingRepo.findByUserId(userId);
        return bookings.stream()
                .map(BookingMapper::toBookingResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────
    // Hủy booking
    // ─────────────────────────────────────────────────────
    @Transactional
    public BookingResponse cancel(Integer bookingId, Integer userId) {
        Booking booking = bookingRepo.findByIdWithDetails(bookingId);
        if (booking == null) {
            throw new ResourceNotFoundException("Booking not found with id: " + bookingId);
        }

        User requester = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isOwner = booking.getUser().getUserId().equals(userId);
        boolean isAdminOrReceptionist = requester.getRole().getName().equalsIgnoreCase("ADMIN")
                || requester.getRole().getName().equalsIgnoreCase("RECEPTIONIST");

        if (!isOwner && !isAdminOrReceptionist) {
            throw new ConflictException("You can only cancel your own bookings");
        }

        if (booking.getStatus() == Status.Cancelled ||
                booking.getStatus() == Status.CheckedIn ||
                booking.getStatus() == Status.CheckedOut) {
            throw new ConflictException("Cannot cancel a booking that is " + booking.getStatus());
        }

        booking.setStatus(Status.Cancelled);
        roomService.updateStatus(booking.getRoom().getRoomId(), 1);

        booking.setUpdatedAt(LocalDateTime.now());

        Booking updated = bookingRepo.save(booking);
        return BookingMapper.toBookingResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByStatus(String statusStr) {
        Status status;
        try {
            status = Status.fromString(statusStr);
        } catch (IllegalArgumentException e) {
            try {
                status = Status.valueOf(statusStr);
            } catch (IllegalArgumentException ex) {
                throw new ConflictException("Invalid status: " + statusStr);
            }
        }

        List<Booking> bookings = bookingRepo.findByStatus(status);
        return bookings.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(BookingMapper::toBookingResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        List<Booking> list = bookingRepo.findAll();
        return list.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(BookingMapper::toBookingResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse updateStatus(Integer bookingId, String statusStr) {
        Booking booking = bookingRepo.findByIdWithDetails(bookingId);
        if (booking == null) {
            throw new ResourceNotFoundException("Booking not found: " + bookingId);
        }

        Status newStatus;
        try {
            newStatus = Status.fromString(statusStr);
        } catch (Exception e) {
            try {
                newStatus = Status.valueOf(statusStr);
            } catch (IllegalArgumentException ex) {
                throw new ConflictException("Invalid status: " + statusStr);
            }
        }

        if (newStatus == Status.CheckedIn) {
            Room room = booking.getRoom();
            String roomStatusName = room.getStatus().getName();
            // Assuming "Available" is the standard status for ready rooms
            if (!"Available".equalsIgnoreCase(roomStatusName)) {
                throw new ConflictException("Room " + room.getRoomNumber()
                        + " is not ready for check-in. Current status: " + roomStatusName);
            }
        }

        booking.setStatus(newStatus);
        booking.setUpdatedAt(LocalDateTime.now());

        Booking saved = bookingRepo.save(booking);
        return BookingMapper.toBookingResponse(saved);
    }

    @Transactional
    public BookingResponse updateCheckoutDate(Integer bookingId, LocalDate newCheckoutDate) {
        Booking booking = bookingRepo.findByIdWithDetails(bookingId);
        if (booking == null) {
            throw new ResourceNotFoundException("Booking not found: " + bookingId);
        }

        if (booking.getStatus() == Status.Cancelled || booking.getStatus() == Status.CheckedOut) {
            throw new ConflictException("Cannot update checkout date for Cancelled or Checked-out bookings");
        }

        if (!newCheckoutDate.isAfter(booking.getCheckinTime())) {
            throw new ConflictException(
                    "New checkout date must be after check-in date (" + booking.getCheckinTime() + ")");
        }

        // Check availability if extending or changing dates (safest is to always check
        // excluding self)
        long overlap = bookingRepo.countOverlappingExcludingBooking(
                booking.getRoom().getRoomId(),
                booking.getCheckinTime(),
                newCheckoutDate,
                Status.Cancelled,
                bookingId);

        if (overlap > 0) {
            throw new ConflictException("Room is not available for the selected dates");
        }

        // Recalculate price
        long nights = ChronoUnit.DAYS.between(booking.getCheckinTime(), newCheckoutDate);
        if (nights < 1)
            nights = 1; // Minimum 1 night

        double newTotalPrice = booking.getRoom().getPrice() * nights;

        booking.setCheckoutTime(newCheckoutDate);
        booking.setTotalPrice(newTotalPrice);
        booking.setUpdatedAt(LocalDateTime.now());

        Booking saved = bookingRepo.save(booking);
        return BookingMapper.toBookingResponse(saved);
    }
}
