package com.example.spring_project.service;

import com.example.spring_project.entity.*;
import com.example.spring_project.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    private final ServiceRequestService serviceRequestService;
    private final UserRepository userRepository;

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void performAutoCheckout() {
        LocalDate today = LocalDate.now();
        int currentHour = java.time.LocalTime.now().getHour();
        log.info("[AutoCheckout] Scheduler triggered at {}h. Checking for overdue bookings on {}...", currentHour,
                today);

        // 1. Find overdue CheckedIn bookings (includes today)
        List<Booking> candidates = bookingRepository.findOverdueCheckedIn(today);
        if (candidates.isEmpty()) {
            log.info("[AutoCheckout] No overdue bookings found.");
            return;
        }

        // Filter: If checkout is today, only process if it's 12:00 or later
        List<Booking> toProcess = candidates.stream()
                .filter(b -> b.getCheckoutTime().isBefore(today) || currentHour >= 12)
                .toList();

        if (toProcess.isEmpty()) {
            log.info("[AutoCheckout] Found candidates for today, but skipping until 12:00 PM.");
            return;
        }

        log.info("[AutoCheckout] Found {} booking(s) to process.", toProcess.size());

        // 2. Resolve the "Cleaning" room status
        RoomStatus cleaningStatus = roomStatusRepository.findByName("Cleaning")
                .or(() -> roomStatusRepository.findByName("cleaning"))
                .orElseGet(() -> {
                    log.warn("[AutoCheckout] 'Cleaning' RoomStatus not found in DB.");
                    return null;
                });

        for (Booking booking : toProcess) {
            try {
                processBookingCheckout(booking, cleaningStatus);
            } catch (Exception e) {
                log.error("[AutoCheckout] Failed to process booking #{}: {}",
                        booking.getBookingId(), e.getMessage(), e);
            }
        }

        log.info("[AutoCheckout] Done. Processed {} booking(s).", toProcess.size());
    }

    private void processBookingCheckout(Booking booking, RoomStatus cleaningStatus) {
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
            log.info("[AutoCheckout] Room {} → Cleaning", room.getRoomNumber());
        }

        // ── Step C: Create CLEANING service request (Auto-assignment handled by
        // service) ──
        User requester = booking.getReceptionist();
        if (requester == null) {
            // Fallback to admin (ID=1)
            requester = userRepository.findById(1).orElse(null);
        }

        String description = String.format(
                "Auto-checkout: Phòng %s cần dọn dẹp sau khi khách trả phòng (Booking #%d)",
                room.getRoomNumber(), bookingId);

        serviceRequestService.createRequest(
                booking,
                requester,
                room.getRoomId(),
                description,
                ServiceRequestType.CLEANING,
                "High");

        log.info("[AutoCheckout] Cleaning request created for Room {}", room.getRoomNumber());
    }
}
