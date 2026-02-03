package com.example.spring_project.repository;



import com.example.spring_project.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Integer> {

    /**
     * Tìm các phòng Available, không bị overlap booking trong khoảng [checkin, checkout),
     * đồng thời filter capacity >= guestCount.
     *
     * Subquery loại trừ phòng đã có booking overlap (status != Cancelled).
     */
    @Query("""
            SELECT r FROM Room r
            WHERE r.status.name = 'Available'
              AND r.capacity >= :guestCount
              AND r.roomId NOT IN (
                  SELECT b.room.roomId FROM Booking b
                  WHERE b.status <> com.example.spring_project.entity.Booking.Status.Cancelled
                    AND b.checkinTime  < :checkout
                    AND b.checkoutTime > :checkin
              )
    """)
    List<Room> findAvailableRooms(
            @Param("checkin")    LocalDateTime checkin,
            @Param("checkout")  LocalDateTime checkout,
            @Param("guestCount") Integer guestCount
    );

    /**
     * Overload: thêm filter theo categoryId (nullable — nếu null thì bỏ qua).
     */
    @Query("""
            SELECT r FROM Room r
            WHERE r.status.name = 'Available'
              AND r.capacity >= :guestCount
              AND (:categoryId IS NULL OR r.category.categoryId = :categoryId)
              AND (:minPrice   IS NULL OR r.price >= :minPrice)
              AND (:maxPrice   IS NULL OR r.price <= :maxPrice)
              AND r.roomId NOT IN (
                  SELECT b.room.roomId FROM Booking b
                  WHERE b.status <> com.example.spring_project.entity.Booking.Status.Cancelled
                    AND b.checkinTime  < :checkout
                    AND b.checkoutTime > :checkin
              )
            ORDER BY r.price ASC
    """)
    List<Room> findAvailableRoomsFiltered(
            @Param("checkin")     LocalDateTime checkin,
            @Param("checkout")   LocalDateTime checkout,
            @Param("guestCount") Integer       guestCount,
            @Param("categoryId") Integer       categoryId,
            @Param("minPrice")   Double        minPrice,
            @Param("maxPrice")   Double        maxPrice
    );
}