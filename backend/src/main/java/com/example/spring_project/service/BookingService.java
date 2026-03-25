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
import com.example.spring_project.entity.Customer;
import com.example.spring_project.repository.BookingRepository;
import com.example.spring_project.repository.CustomerRepository;
import com.example.spring_project.repository.UserRepository;
import com.example.spring_project.util.BookingMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepo;
    private final RoomService roomService;
    private final UserRepository userRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final ServiceRequestService serviceRequestService;
    private final CustomerRepository customerRepo;

    public BookingService(BookingRepository bookingRepo,
            RoomService roomService,
            UserRepository userRepo,
            SimpMessagingTemplate messagingTemplate,
            ServiceRequestService serviceRequestService,
            CustomerRepository customerRepo) {
        this.bookingRepo = bookingRepo;
        this.roomService = roomService;
        this.userRepo = userRepo;
        this.messagingTemplate = messagingTemplate;
        this.serviceRequestService = serviceRequestService;
        this.customerRepo = customerRepo;
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
                req.getCheckoutTime());
        if (overlap > 0) {
            throw new ConflictException("Room is not available for the selected dates");
        }

        // 5.0) Check Physical Room Status for immediate bookings
        // If the booking starts today and the room is 'Cleaning', block creation.
        String currentRoomStatus = room.getStatus().getName();
        LocalDateTime nowLimit = LocalDateTime.now().plusHours(2); // Buffer of 2 hours
        if ("Cleaning".equalsIgnoreCase(currentRoomStatus) && req.getCheckinTime().isBefore(nowLimit)) {
            throw new ConflictException("Room " + room.getRoomNumber()
                    + " is currently being cleaned. It cannot be booked for immediate check-in.");
        }


        // 5.1) Find or Create Customer
        Customer customer = customerRepo.findByNameAndPhoneAndIdNumber(
                req.getGuestName(), req.getGuestPhone(), req.getGuestIdNumber())
                .orElseGet(() -> {
                    Customer newCustomer = new Customer();
                    newCustomer.setName(req.getGuestName());
                    newCustomer.setPhone(req.getGuestPhone());
                    newCustomer.setIdNumber(req.getGuestIdNumber());
                    newCustomer.setEmail(req.getGuestEmail());
                    newCustomer.setNationality(req.getGuestNationality());
                    return customerRepo.save(newCustomer);
                });

        // 5.2) Validate Guest Info (Prevent multiple active bookings for same identity: Name + Phone + ID)
        List<Status> activeStatuses = java.util.Arrays.asList(Status.Confirmed, Status.CheckedIn);
        if (bookingRepo.existsByCustomerCustomerIdAndStatusIn(customer.getCustomerId(), activeStatuses)) {
            throw new ConflictException("Guest already has an active booking (Confirmed or Checked-in). " +
                    "Please check out the current booking before rebooking.");
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
        booking.setCustomer(customer);
        booking.setRoom(room);
        booking.setGuestName(req.getGuestName());
        booking.setGuestEmail(req.getGuestEmail());
        booking.setGuestPhone(req.getGuestPhone());
        booking.setGuestIdNumber(req.getGuestIdNumber());
        booking.setGuestNationality(req.getGuestNationality());
        booking.setGuestCount(req.getGuestCount());
        booking.setSpecialRequest(req.getSpecialRequest());

        // Ghi lại nhân viên tạo đơn (Walk-in)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            User currentStaff = userRepo.findByEmail(auth.getName()).orElse(null);
            booking.setReceptionist(currentStaff);
        }

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
    public double calculateTotalPrice(Room room, LocalDateTime checkin, LocalDateTime checkout) {
        if (!checkin.isBefore(checkout)) {
            return 0.0;
        }

        double totalPrice = 0.0;
        double basePrice = room.getPrice();
        LocalDateTime currentDate = checkin;

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

    private boolean isHoliday(LocalDateTime date) {
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
    public double previewPrice(Integer roomId, LocalDateTime checkin, LocalDateTime checkout) {
        Room room = roomService.getEntityById(roomId);
        double price = calculateTotalPrice(room, checkin, checkout);
        return price <= 0 ? room.getPrice() : price;
    }

    private boolean isWeekend(LocalDateTime date) {
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

        // Lưu vết nhân viên thực hiện hủy (nếu là staff)
        if (isAdminOrReceptionist) {
            booking.setReceptionist(requester);
        }

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
    public BookingResponse checkIn(Integer bookingId) {
        Booking booking = bookingRepo.findByIdWithDetails(bookingId);
        if (booking == null) {
            throw new ResourceNotFoundException("Booking not found: " + bookingId);
        }

        if (booking.getStatus() != Status.Confirmed) {
            throw new ConflictException(
                    "Only Confirmed bookings can be checked-in. Current status: " + booking.getStatus());
        }

        // Strict Time Validation
        LocalDateTime today = LocalDateTime.now();
        if (today.isBefore(booking.getCheckinTime())) {
            throw new ConflictException(
                    "Cannot check-in before the reservation date (" + booking.getCheckinTime() + ")");
        }
        if (today.isAfter(booking.getCheckoutTime()) || today.isEqual(booking.getCheckoutTime())) {
            throw new ConflictException(
                    "Reservation period has already passed. Scheduled checkout was " + booking.getCheckoutTime());
        }

        // Check Physical Room Status
        String roomStatusName = booking.getRoom().getStatus().getName();
        if ("Cleaning".equalsIgnoreCase(roomStatusName)) {
            throw new ConflictException("Room " + booking.getRoom().getRoomNumber()
                    + " is still being cleaned. Please wait or use housekeeping override.");
        }

        booking.setStatus(Status.CheckedIn);
        booking.setUpdatedAt(LocalDateTime.now());

        // Ghi lại nhân viên thực hiện check-in
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            User currentStaff = userRepo.findByEmail(auth.getName()).orElse(null);
            booking.setReceptionist(currentStaff);
        }

        // Cập nhật trạng thái phòng → Occupied
        roomService.updateRoomStatus(booking.getRoom().getRoomId(), "Occupied");

        Booking saved = bookingRepo.save(booking);
        return BookingMapper.toBookingResponse(saved);
    }

    @Transactional
    public BookingResponse checkOut(Integer bookingId) {
        Booking booking = bookingRepo.findByIdWithDetails(bookingId);
        if (booking == null) {
            throw new ResourceNotFoundException("Booking not found: " + bookingId);
        }

        if (booking.getStatus() != Status.CheckedIn) {
            throw new ConflictException(
                    "Only Checked-in bookings can be checked-out. Current status: " + booking.getStatus());
        }

        booking.setStatus(Status.CheckedOut);
        booking.setUpdatedAt(LocalDateTime.now());

        // Ghi lại nhân viên thực hiện check-out
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentStaff = null;
        if (auth != null && auth.isAuthenticated()) {
            currentStaff = userRepo.findByEmail(auth.getName()).orElse(null);
            booking.setReceptionist(currentStaff);
        }

        // Đổi trạng thái phòng → Cleaning
        roomService.updateRoomStatus(booking.getRoom().getRoomId(), "Cleaning");

        Booking saved = bookingRepo.save(booking);

        // Tự động tạo cleaning request (Sử dụng nhân viên vừa check-out hoặc người tạo đơn)
        User cleaningRequestCreator = (currentStaff != null) ? currentStaff : saved.getReceptionist();
        if (cleaningRequestCreator == null) {
            cleaningRequestCreator = saved.getUser(); // Fallback to guest if no staff
        }

        String description = "Room " + saved.getRoom().getRoomNumber() + " needs cleaning after guest check-out.";
        serviceRequestService.createRequest(
                saved,
                cleaningRequestCreator,
                saved.getRoom().getRoomId(),
                description,
                ServiceRequestType.CLEANING,
                "High");

        // Real-time WebSocket notification
        messagingTemplate.convertAndSend("/topic/maintenance",
                "New cleaning request for room " + saved.getRoom().getRoomNumber());

        return BookingMapper.toBookingResponse(saved);
    }

    /**
     * @deprecated Use checkIn() or checkOut() instead.
     */
    @Deprecated
    @Transactional
    public BookingResponse updateStatus(Integer bookingId, String statusStr) {
        Status newStatus = Status.fromString(statusStr);
        if (newStatus == Status.CheckedIn)
            return checkIn(bookingId);
        if (newStatus == Status.CheckedOut)
            return checkOut(bookingId);
        if (newStatus == Status.Cancelled)
            return cancel(bookingId, null); // Basic cancel

        throw new ConflictException("Unsupported status transition via generic method: " + statusStr);
    }

    @Transactional
    public BookingResponse updateCheckoutDate(Integer bookingId, LocalDateTime newCheckoutDate) {
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
        double newTotalPrice = calculateTotalPrice(booking.getRoom(), booking.getCheckinTime(), newCheckoutDate);
        if (newTotalPrice <= 0) {
            newTotalPrice = booking.getRoom().getPrice();
        }

        booking.setCheckoutTime(newCheckoutDate);
        booking.setTotalPrice(newTotalPrice);
        booking.setUpdatedAt(LocalDateTime.now());

        Booking saved = bookingRepo.save(booking);
        return BookingMapper.toBookingResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByGuest(String name, String phone, String idNumber) {
        List<Booking> list = bookingRepo.findByGuestInfo(name, phone, idNumber);
        return list.stream()
                .map(BookingMapper::toBookingResponse)
                .collect(Collectors.toList());
    }
}
