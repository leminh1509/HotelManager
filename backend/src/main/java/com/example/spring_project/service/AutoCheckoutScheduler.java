package com.example.spring_project.service;

import com.example.spring_project.entity.*;
import com.example.spring_project.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * AutoCheckoutScheduler – runs every hour.
 *
 * For each booking that is still "Checked-in" but whose checkout date
 * has already passed, the scheduler will:
 * 1. Mark the booking as "Checked-out"
 * 2. Set the room status to "Cleaning"
 * 3. Create a CLEANING ServiceRequest for the room
 * 4. Auto-assign the request to the Staff member with the fewest
 * active (non-completed) tasks (load balancing)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AutoCheckoutScheduler {

    private final BookingRepository bookingRepository;
    private final RoomStatusRepository roomStatusRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final UserRepository userRepository;

    /** Runs at the top of every hour: 0 seconds, 0 minutes, every hour */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void performAutoCheckout() {
        LocalDate today = LocalDate.now();
        log.info("[AutoCheckout] Scheduler triggered. Checking for overdue bookings on {}...", today);

        // 1. Find overdue CheckedIn bookings
        List<Booking> overdue = bookingRepository.findOverdueCheckedIn(today);
        if (overdue.isEmpty()) {
            log.info("[AutoCheckout] No overdue bookings found.");
            return;
        }
        log.info("[AutoCheckout] Found {} overdue booking(s) to process.", overdue.size());

        // 2. Resolve the "Cleaning" room status (fallback to first available status)
        RoomStatus cleaningStatus = roomStatusRepository.findByName("Cleaning")
                .or(() -> roomStatusRepository.findByName("cleaning"))
                .orElseGet(() -> {
                    log.warn("[AutoCheckout] 'Cleaning' RoomStatus not found in DB – room status will not be updated.");
                    return null;
                });

        // 3. Load all active Staff users for assignment
        List<User> staffList = userRepository.findByRole_Name("Staff")
                .stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()) && u.getDeletedAt() == null)
                .toList();

        if (staffList.isEmpty()) {
            log.warn("[AutoCheckout] No active Staff found – cleaning tasks will be created but unassigned.");
        }

        for (Booking booking : overdue) {
            try {
                processBookingCheckout(booking, cleaningStatus, staffList);
            } catch (Exception e) {
                log.error("[AutoCheckout] Failed to process booking #{}: {}",
                        booking.getBookingId(), e.getMessage(), e);
            }
        }

        log.info("[AutoCheckout] Done. Processed {} booking(s).", overdue.size());
    }

    private void processBookingCheckout(Booking booking, RoomStatus cleaningStatus, List<User> staffList) {
        Room room = booking.getRoom();
        int bookingId = booking.getBookingId();

        log.info("[AutoCheckout] Processing booking #{} – Room {}", bookingId, room.getRoomNumber());

        // ── Step A: Mark booking as Checked-out ──────────────────────────
        booking.setStatus(Booking.Status.CheckedOut);
        bookingRepository.save(booking);
        log.info("[AutoCheckout] Booking #{} → CheckedOut", bookingId);

        // ── Step B: Update room status to Cleaning ───────────────────────
        if (cleaningStatus != null) {
            room.setStatus(cleaningStatus);
            // Room will be updated via cascade since it's already managed
            log.info("[AutoCheckout] Room {} → Cleaning", room.getRoomNumber());
        }

        // ── Step C: Create CLEANING service request ──────────────────────
        User assignedStaff = pickLeastBusyStaff(staffList);

        // Requester is the assigned staff (or first staff found, or fallback to admin)
        User requester = assignedStaff;
        if (requester == null && !staffList.isEmpty()) {
            requester = staffList.get(0);
        }
        if (requester == null) {
            // Fallback to admin (ID=1) if no staff available
            requester = userRepository.findById(1).orElse(null);
        }

        ServiceRequest cleaningRequest = ServiceRequest.builder()
                .booking(booking)
                .requester(requester)
                .type(ServiceRequestType.CLEANING.name())
                .priority("High")
                .status(ServiceRequestStatus.New)
                .description(String.format(
                        "Auto-checkout: Phòng %s cần dọn dẹp sau khi khách trả phòng (Booking #%d)",
                        room.getRoomNumber(), bookingId))
                .assignedTo(assignedStaff)
                .build();

        serviceRequestRepository.save(cleaningRequest);

        if (assignedStaff != null) {
            log.info("[AutoCheckout] Cleaning request created for Room {} → Assigned to {} (userId={})",
                    room.getRoomNumber(), assignedStaff.getFullName(), assignedStaff.getUserId());
        } else {
            log.info("[AutoCheckout] Cleaning request created for Room {} → Unassigned (no Staff available)",
                    room.getRoomNumber());
        }
    }

    /**
     * Pick the staff member with the fewest non-completed service requests.
     * Returns null if staffList is empty.
     */
    private User pickLeastBusyStaff(List<User> staffList) {
        if (staffList.isEmpty())
            return null;

        return staffList.stream()
                .min(Comparator.comparingLong(
                        staff -> serviceRequestRepository.countActiveTasksByUser(staff.getUserId())))
                .orElse(null);
    }
}
