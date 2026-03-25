package com.example.spring_project.repository;

import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.Booking.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import com.example.spring_project.entity.Room;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Integer> {

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT r FROM Room r WHERE r.roomId = :roomId")
        Optional<Room> findRoomForUpdate(@Param("roomId") Integer roomId);

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
                                  AND b.status IN (com.example.spring_project.entity.Booking.Status.Confirmed, com.example.spring_project.entity.Booking.Status.CheckedIn)
                                  AND b.checkinTime   < :checkout
                                  AND b.checkoutTime  > :checkin
                        """)
        Long countOverlapping(
                        @Param("roomId") Integer roomId,
                        @Param("checkin") LocalDateTime checkin,
                        @Param("checkout") LocalDateTime checkout);

        /**
         * Kiểm tra overlap trừ booking hiện tại (dùng khi update booking).
         */
        @Query("""
                                SELECT COUNT(b) FROM Booking b
                                WHERE b.room.roomId    = :roomId
                                  AND b.bookingId     <> :excludeBookingId
                                  AND b.status IN (com.example.spring_project.entity.Booking.Status.Confirmed, com.example.spring_project.entity.Booking.Status.CheckedIn)
                                  AND b.checkinTime   < :checkout
                                  AND b.checkoutTime  > :checkin
                        """)
        Long countOverlappingExcludingBooking(
                        @Param("roomId") Integer roomId,
                        @Param("checkin") LocalDateTime checkin,
                        @Param("checkout") LocalDateTime checkout,
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
        List<Booking> findOverdueCheckedIn(@Param("today") LocalDateTime today);

        boolean existsByCustomerPhoneAndStatusIn(String phone, List<Status> statuses);

        boolean existsByCustomerEmailAndStatusIn(String email, List<Status> statuses);

        boolean existsByCustomerIdNumberAndStatusIn(String idNumber, List<Status> statuses);

        List<Booking> findByRoomRoomIdAndStatus(Integer roomId, Status status);

        @Query("""
                            SELECT b FROM Booking b
                            JOIN b.customer c
                            WHERE c.name = :name AND c.phone = :phone AND c.idNumber = :idNumber
                            ORDER BY b.createdAt DESC
                        """)
        List<Booking> findByGuestInfo(
                        @Param("name") String name,
                        @Param("phone") String phone,
                        @Param("idNumber") String idNumber);

        @Query("""
            SELECT COUNT(b) > 0 FROM Booking b 
            WHERE b.customer.customerId = :customerId AND b.status IN :statuses
        """)
        boolean existsByCustomerIdAndStatusIn(
                        @Param("customerId") Integer customerId,
                        @Param("statuses") List<Status> statuses);

        boolean existsByCustomerCustomerIdAndStatusIn(Integer customerId, List<Status> statuses);
}
