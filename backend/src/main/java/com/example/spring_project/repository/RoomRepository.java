package com.example.spring_project.repository;

import com.example.spring_project.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Integer> {

  /**
   * Tìm các phòng Available, không bị overlap booking trong khoảng [checkin,
   * checkout),
   * đồng thời filter capacity >= guestCount.
   *
   * Subquery loại trừ phòng đã có booking overlap (status != Cancelled).
   */
  @Modifying
  @Transactional
  @Query("""
          UPDATE Room r
          SET r.status.statusId = :statusId
          WHERE r.roomId = :roomId
      """)
  int updateRoomStatus(
      @Param("roomId") Integer roomId,
      @Param("statusId") Integer statusId);

  @Query("""
              SELECT r FROM Room r
              WHERE r.status.name NOT IN ('Maintenance', 'OutOfService')
                AND r.capacity >= :guestCount
                AND NOT EXISTS (
                    SELECT 1 FROM Booking b
                    WHERE b.room.roomId = r.roomId
                      AND b.status IN (com.example.spring_project.entity.Booking.Status.Confirmed, com.example.spring_project.entity.Booking.Status.CheckedIn)
                      AND b.checkinTime  < :checkout
                      AND b.checkoutTime > :checkin
                )
      """)
  List<Room> findAvailableRooms(
      @Param("checkin") LocalDate checkin,
      @Param("checkout") LocalDate checkout,
      @Param("guestCount") Integer guestCount);

  /**
   * Overload: thêm filter theo categoryId (nullable — nếu null thì bỏ qua).
   */
  @Query("""
              SELECT r FROM Room r
              WHERE r.status.name NOT IN ('Maintenance', 'OutOfService')
                AND r.capacity >= :guestCount
                AND (:categoryId IS NULL OR r.category.categoryId = :categoryId)
                AND (:minPrice   IS NULL OR r.price >= :minPrice)
                AND (:maxPrice   IS NULL OR r.price <= :maxPrice)
                AND NOT EXISTS (
                    SELECT 1 FROM Booking b
                    WHERE b.room.roomId = r.roomId
                      AND b.status IN (com.example.spring_project.entity.Booking.Status.Confirmed, com.example.spring_project.entity.Booking.Status.CheckedIn)
                      AND b.checkinTime  < :checkout
                      AND b.checkoutTime > :checkin
                )
              ORDER BY r.price ASC
      """)
  List<Room> findAvailableRoomsFiltered(
      @Param("checkin") LocalDate checkin,
      @Param("checkout") LocalDate checkout,
      @Param("guestCount") Integer guestCount,
      @Param("categoryId") Integer categoryId,
      @Param("minPrice") Double minPrice,
      @Param("maxPrice") Double maxPrice);

  @Query("""
              SELECT r FROM Room r
              WHERE r.status.name NOT IN ('Maintenance', 'OutOfService')
                AND r.capacity >= :guestCount
                AND (:categoryId IS NULL OR r.category.categoryId = :categoryId)
                AND (:minPrice   IS NULL OR r.price >= :minPrice)
                AND (:maxPrice   IS NULL OR r.price <= :maxPrice)
                AND NOT EXISTS (
                    SELECT 1 FROM Booking b
                    WHERE b.room.roomId = r.roomId
                      AND b.status IN (com.example.spring_project.entity.Booking.Status.Confirmed, com.example.spring_project.entity.Booking.Status.CheckedIn)
                      AND b.checkinTime  < :checkout
                      AND b.checkoutTime > :checkin
                )
      """)
  org.springframework.data.domain.Page<Room> findAvailableRoomsFilteredPage(
      @Param("checkin") LocalDate checkin,
      @Param("checkout") LocalDate checkout,
      @Param("guestCount") Integer guestCount,
      @Param("categoryId") Integer categoryId,
      @Param("minPrice") Double minPrice,
      @Param("maxPrice") Double maxPrice,
      org.springframework.data.domain.Pageable pageable);

  @Query("""
          SELECT r FROM Room r
          WHERE (:statusFilter = 'all')
             OR (:statusFilter = 'available' AND r.status.name = 'Available')
             OR (:statusFilter = 'booked' AND r.status.name = 'Occupied')
             OR (:statusFilter = 'unavailable' AND r.status.name NOT IN ('Available', 'Occupied'))
      """)
  org.springframework.data.domain.Page<Room> findRoomsByStatusPage(
      @Param("statusFilter") String statusFilter,
      org.springframework.data.domain.Pageable pageable);
}