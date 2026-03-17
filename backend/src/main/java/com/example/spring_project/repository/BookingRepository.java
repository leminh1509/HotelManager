package com.example.spring_project.repository;

import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.Booking.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Integer> {

        /**
         * Lấy tất cả bookings của một user, sắp xếp mới nhất trước.
         */
        @Query("""
                                SELECT b FROM Booking b
                                WHERE b.user.userId = :userId
                                ORDER BY b.createdAt DESC
                        """)
        List<Booking> findByUserId(@Param("userId") Integer userId);

        /**
         * Lấy tất cả bookings của một room, sắp xếp mới nhất trước.
         */
        @Query("""
                                SELECT b FROM Booking b
                                WHERE b.room.roomId = :roomId
                                ORDER BY b.createdAt DESC
                        """)
        List<Booking> findByRoomId(@Param("roomId") Integer roomId);

        /**
         * Kiểm tra xem phòng có booking overlap không (trừ Cancelled).
         * Dùng trước khi confirm booking mới.
         */
        @Query("""
                                SELECT COUNT(b) FROM Booking b
                                WHERE b.room.roomId    = :roomId
                                  AND b.status        <> :cancelled
                                  AND b.checkinTime   < :checkout
                                  AND b.checkoutTime  > :checkin
                        """)
        Long countOverlapping(
                        @Param("roomId") Integer roomId,
                        @Param("checkin") LocalDate checkin,
                        @Param("checkout") LocalDate checkout,
                        @Param("cancelled") Status cancelled);

        /**
         * Kiểm tra overlap trừ booking hiện tại (dùng khi update booking).
         */
        @Query("""
                                SELECT COUNT(b) FROM Booking b
                                WHERE b.room.roomId    = :roomId
                                  AND b.bookingId     <> :excludeBookingId
                                  AND b.status        <> :cancelled
                                  AND b.checkinTime   < :checkout
                                  AND b.checkoutTime  > :checkin
                        """)
        Long countOverlappingExcludingBooking(
                        @Param("roomId") Integer roomId,
                        @Param("checkin") LocalDate checkin,
                        @Param("checkout") LocalDate checkout,
                        @Param("cancelled") Status cancelled,
                        @Param("excludeBookingId") Integer excludeBookingId);

        List<Booking> findByStatus(Status status);

        /**
         * Lấy booking kèm fetch eager room + category + status để map DTO.
         */
        @Query("""
                                SELECT b FROM Booking b
                                JOIN FETCH b.room r
                                JOIN FETCH r.category
                                JOIN FETCH r.status
                                JOIN FETCH b.user
                                WHERE b.bookingId = :id
                        """)
        Booking findByIdWithDetails(@Param("id") Integer id);

        /**
         * Find bookings that are still CheckedIn but their checkout date has passed.
         * Used by the auto-checkout scheduler.
         */
        @Query("""
                                SELECT b FROM Booking b
                                JOIN FETCH b.room r
                                JOIN FETCH r.status
                                WHERE b.checkoutTime <= :today
                                  AND b.status IN (com.example.spring_project.entity.Booking.Status.CheckedIn, com.example.spring_project.entity.Booking.Status.Confirmed)
                        """)
        List<Booking> findOverdueCheckedIn(@Param("today") LocalDate today);

        @Query("""
                    SELECT COUNT(b) > 0 FROM Booking b
                    WHERE b.guestPhone = :phone
                      AND b.status IN (com.example.spring_project.entity.Booking.Status.Confirmed, com.example.spring_project.entity.Booking.Status.CheckedIn)
                """)
        boolean existsByActivePhone(@Param("phone") String phone);

        @Query("""
                    SELECT COUNT(b) > 0 FROM Booking b
                    WHERE b.guestEmail = :email
                      AND b.status IN (com.example.spring_project.entity.Booking.Status.Confirmed, com.example.spring_project.entity.Booking.Status.CheckedIn)
                """)
        boolean existsByActiveEmail(@Param("email") String email);

        @Query("""
                    SELECT COUNT(b) > 0 FROM Booking b
                    WHERE b.guestIdNumber = :idNumber
                      AND b.status IN (com.example.spring_project.entity.Booking.Status.Confirmed, com.example.spring_project.entity.Booking.Status.CheckedIn)
                """)
        boolean existsByActiveIdNumber(@Param("idNumber") String idNumber);

        List<Booking> findByRoomRoomIdAndStatus(Integer roomId, Status status);

        @Query(value = """
                            SELECT
                                guest_name,
                                MAX(guest_email) as guest_email,
                                guest_phone,
                                MAX(guest_id_number) as guest_id_number,
                                MAX(guest_nationality) as guest_nationality,
                                MAX(guest_address) as guest_address,
                                MAX(CASE WHEN status IN ('Confirmed', 'Checked-in') THEN 1 ELSE 0 END) as has_active_booking
                            FROM booking
                            WHERE (:name IS NULL OR LOWER(guest_name) LIKE LOWER(CONCAT('%', :name, '%')))
                              AND (:phone IS NULL OR guest_phone LIKE CONCAT('%', :phone, '%'))
                              AND (:idNumber IS NULL OR guest_id_number LIKE CONCAT('%', :idNumber, '%'))
                            GROUP BY guest_name, guest_phone
                        """, countQuery = """
                            SELECT COUNT(*) FROM (
                                SELECT guest_name, guest_phone
                                FROM booking
                                WHERE (:name IS NULL OR LOWER(guest_name) LIKE LOWER(CONCAT('%', :name, '%')))
                                  AND (:phone IS NULL OR guest_phone LIKE CONCAT('%', :phone, '%'))
                                  AND (:idNumber IS NULL OR guest_id_number LIKE CONCAT('%', :idNumber, '%'))
                                GROUP BY guest_name, guest_phone
                            ) AS sub
                        """, nativeQuery = true)
        Page<Object[]> findUniqueGuests(
                        @Param("name") String name,
                        @Param("phone") String phone,
                        @Param("idNumber") String idNumber,
                        Pageable pageable);

        @Query("""
                            SELECT b FROM Booking b
                            WHERE b.guestName = :name AND b.guestPhone = :phone
                            ORDER BY b.createdAt DESC
                        """)
        List<Booking> findByGuestInfo(@Param("name") String name, @Param("phone") String phone);
}
