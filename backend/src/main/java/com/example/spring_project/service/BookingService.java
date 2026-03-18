package com.example.spring_project.service;

import com.example.spring_project.dto.BookingCreateRequest;
import com.example.spring_project.dto.BookingResponse;
import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.Booking.Status;
import com.example.spring_project.entity.Room;
import com.example.spring_project.entity.ServiceRequestType;
import com.example.spring_project.entity.User;
import com.example.spring_project.exception.ConflictException;
import com.example.spring_project.exception.ResourceNotFoundException;
import com.example.spring_project.repository.BookingRepository;
import com.example.spring_project.repository.UserRepository;
import com.example.spring_project.util.BookingMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

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
    private final SimpMessagingTemplate messagingTemplate;
    private final ServiceRequestService serviceRequestService;

    public BookingService(BookingRepository bookingRepo,
            RoomService roomService,
            UserRepository userRepo,
            SimpMessagingTemplate messagingTemplate,
            ServiceRequestService serviceRequestService) {
        this.bookingRepo = bookingRepo;
        this.roomService = roomService;
        this.userRepo = userRepo;
        this.messagingTemplate = messagingTemplate;
        this.serviceRequestService = serviceRequestService;
    }

    // ─────────────────────────────────────────────────────
    // Tạo booking mới
    // ─────────────────────────────────────────────────────
    @Transactional
    public BookingResponse create(BookingCreateRequest req, Integer userId) {

        // 1) load user (caller — đã auth)
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // 2) load and LOCK room (to prevent race conditions / double booking)
        Room room = bookingRepo.findRoomForUpdate(req.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + req.getRoomId()));

        // Check if room is in a physically unbookable state (Maintenance/OutOfService)
        String physicalStatus = room.getStatus().getName();
        if ("Maintenance".equalsIgnoreCase(physicalStatus) || "OutOfService".equalsIgnoreCase(physicalStatus)) {
            throw new ConflictException("Room " + room.getRoomNumber() + " is currently under " + physicalStatus);
        }

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
                req.getCheckoutTime()
        );
        if (overlap > 0) {
            throw new ConflictException("Room is not available for the selected dates");
        }

        // 5.1) Validate Guest Info (Prevent multiple active bookings for same identity)
        if (req.getGuestPhone() != null && !req.getGuestPhone().isEmpty()) {
            if (bookingRepo.existsByActivePhone(req.getGuestPhone())) {
                throw new ConflictException("Guest with this phone number already has an active booking.");
            }
        }
        if (req.getGuestEmail() != null && !req.getGuestEmail().isEmpty()) {
            if (bookingRepo.existsByActiveEmail(req.getGuestEmail())) {
                throw new ConflictException("Guest with this email address already has an active booking.");
            }
        }
        if (req.getGuestIdNumber() != null && !req.getGuestIdNumber().isEmpty()) {
            if (bookingRepo.existsByActiveIdNumber(req.getGuestIdNumber())) {
                throw new ConflictException("Guest with this ID/Passport number already has an active booking.");
            }
        }

        // 6) tính giá: linh động theo Cuối tuần / Lễ
        double totalPrice = calculateTotalPrice(room, req.getCheckinTime(), req.getCheckoutTime());
        // prevent 0 or negative price on edge cases
        if (totalPrice <= 0) {
            totalPrice = room.getPrice();
        }

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
        booking.setStatus(Status.Confirmed);
        booking.setTotalPrice(totalPrice);
        booking.setCreatedAt(now);
        booking.setUpdatedAt(now);

        // 8) save
        Booking saved = bookingRepo.save(booking);

        return BookingMapper.toBookingResponse(saved);
    }

    // ─────────────────────────────────────────────────────
    // Tính tổng giá tiền linh động (Holiday +50%, Weekend +20%)
    // ─────────────────────────────────────────────────────
    public double calculateTotalPrice(Room room, LocalDate checkin, LocalDate checkout) {
        if (!checkin.isBefore(checkout)) {
            return 0.0;
        }

        double totalPrice = 0.0;
        double basePrice = room.getPrice();
        LocalDate currentDate = checkin;

        while (currentDate.isBefore(checkout)) {
            if (isHoliday(currentDate)) {
                totalPrice += basePrice * 1.5; // +50% for holidays
            } else if (isWeekend(currentDate)) {
                totalPrice += basePrice * 1.2; // +20% for weekends
            } else {
                totalPrice += basePrice;
            }
            currentDate = currentDate.plusDays(1);
        }

        return totalPrice;
    }

    private boolean isHoliday(LocalDate date) {
        int month = date.getMonthValue();
        int day = date.getDayOfMonth();

        // Tết Dương lịch (Jan 1)
        if (month == 1 && day == 1)
            return true;
        // Giải phóng Miền Nam & Quốc tế Lao động (Apr 30, May 1)
        if ((month == 4 && day == 30) || (month == 5 && day == 1))
            return true;
        // Quốc khánh (Sep 2)
        if (month == 9 && day == 2)
            return true;

        return false;
    }

    // ─────────────────────────────────────────────────────
    // Lấy trước tổng giá
    // ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public double previewPrice(Integer roomId, LocalDate checkin, LocalDate checkout) {
        Room room = roomService.getEntityById(roomId);
        double price = calculateTotalPrice(room, checkin, checkout);
        return price <= 0 ? room.getPrice() : price;
    }

    private boolean isWeekend(LocalDate date) {
        java.time.DayOfWeek day = date.getDayOfWeek();
        return day == java.time.DayOfWeek.FRIDAY || day == java.time.DayOfWeek.SATURDAY;
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
    // Lấy booking theo ID phòng
    // ─────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<BookingResponse> getByRoomId(Integer roomId) {
        List<Booking> bookings = bookingRepo.findByRoomId(roomId);
        return bookings.stream()
                .map(BookingMapper::toBookingResponse)
                .collect(Collectors.toList());
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
                .sorted((a, b) -> b.getBookingId().compareTo(a.getBookingId()))
                .map(BookingMapper::toBookingResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        List<Booking> list = bookingRepo.findAll();
        return list.stream()
                .sorted((a, b) -> b.getBookingId().compareTo(a.getBookingId()))
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
            // Strict Time Validation
            LocalDate today = LocalDate.now();
            if (today.isBefore(booking.getCheckinTime())) {
                throw new ConflictException("Cannot check-in before the reservation date (" + booking.getCheckinTime() + ")");
            }
            if (today.isAfter(booking.getCheckoutTime()) || today.isEqual(booking.getCheckoutTime())) {
                throw new ConflictException("Reservation period has already passed. Scheduled checkout was " + booking.getCheckoutTime());
            }

            // Check Physical Room Status (Source of Truth remains the Booking)
            String roomStatusName = booking.getRoom().getStatus().getName();
            // If room is 'Cleaning', we block check-in to ensure quality.
            if ("Cleaning".equalsIgnoreCase(roomStatusName)) {
                throw new ConflictException("Room " + booking.getRoom().getRoomNumber() + " is still being cleaned. Please wait or use housekeeping override.");
            }
        }

        // Cập nhật trạng thái phòng khi check-in
        if (newStatus == Status.CheckedIn) {
            roomService.updateRoomStatus(booking.getRoom().getRoomId(), "Occupied");
        }

        Booking saved = bookingRepo.save(booking);

        // Tự động tạo cleaning request và đổi trạng thái phòng khi check-out
        if (newStatus == Status.CheckedOut) {
            Room room = booking.getRoom();

            // Đổi trạng thái phòng → Cleaning
            roomService.updateRoomStatus(room.getRoomId(), "Cleaning");

            // Lấy user hiện tại (lễ tân)
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = auth != null ? auth.getName() : null;
            User currentUser = null;
            if (currentUserEmail != null) {
                currentUser = userRepo.findByEmail(currentUserEmail).orElse(null);
            }
            // Fallback: use receptionist or booking owner if no auth (e.g. internal call)
            if (currentUser == null) {
                currentUser = saved.getReceptionist();
            }
            if (currentUser == null) {
                currentUser = saved.getUser();
            }

            // Tạo cleaning request tự động
            String description = "Room " + room.getRoomNumber() + " needs cleaning after guest check-out.";
            serviceRequestService.createRequest(
                    saved,
                    currentUser,
                    room.getRoomId(),
                    description,
                    ServiceRequestType.CLEANING,
                    "High");

            // Real-time WebSocket notification
            messagingTemplate.convertAndSend("/topic/maintenance",
                    "New cleaning request for room " + room.getRoomNumber());
        }

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

        // Lock the room to prevent race conditions during checkout extension
        bookingRepo.findRoomForUpdate(booking.getRoom().getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

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

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByGuest(String name, String phone) {
        List<Booking> list = bookingRepo.findByGuestInfo(name, phone);
        return list.stream()
                .map(BookingMapper::toBookingResponse)
                .collect(Collectors.toList());
    }
}
