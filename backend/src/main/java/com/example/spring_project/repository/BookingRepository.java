package com.example.spring_project.repository;

import com.example.spring_project.entity.Booking;
import com.example.spring_project.entity.Booking.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

        /**
         * Lấy booking kèm fetch eager room + category để map DTO.
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

        List<Booking> findByStatus(Status status);
}