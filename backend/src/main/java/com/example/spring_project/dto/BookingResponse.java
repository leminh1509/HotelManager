package com.example.spring_project.dto;

import java.time.LocalDateTime;

/**
 * Response DTO trả về cho client.
 * Flatten room + user info để frontend không cần call thêm API.
 */
public class BookingResponse {

    private Integer bookingId;
    private String status;
    private Double totalPrice;

    // ── room info ──
    private Integer roomId;
    private String roomNumber;
    private String roomName; // = category.name
    private String roomImgUrl;
    private Double roomPrice;
    private Integer roomCapacity;

    // ── guest info ──
    private String guestName;
    private String guestEmail;
    private String guestPhone;
    private String guestIdNumber;
    private String guestNationality;
    private String guestAddress;
    private Integer guestCount;
    private String specialRequest;
    private Boolean earlyCheckin;
    private Boolean lateCheckout;

    // ── dates ──
    private LocalDateTime checkinTime;
    private LocalDateTime checkoutTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── owner ──
    private Integer userId;
    private String userEmail;

    public Integer getBookingId() {
        return bookingId;
    }

    public void setBookingId(Integer v) {
        this.bookingId = v;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String v) {
        this.status = v;
    }

    public Double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(Double v) {
        this.totalPrice = v;
    }

    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer v) {
        this.roomId = v;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String v) {
        this.roomNumber = v;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String v) {
        this.roomName = v;
    }

    public String getRoomImgUrl() {
        return roomImgUrl;
    }

    public void setRoomImgUrl(String v) {
        this.roomImgUrl = v;
    }

    public Double getRoomPrice() {
        return roomPrice;
    }

    public void setRoomPrice(Double v) {
        this.roomPrice = v;
    }

    public Integer getRoomCapacity() {
        return roomCapacity;
    }

    public void setRoomCapacity(Integer v) {
        this.roomCapacity = v;
    }

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String v) {
        this.guestName = v;
    }

    public String getGuestEmail() {
        return guestEmail;
    }

    public void setGuestEmail(String v) {
        this.guestEmail = v;
    }

    public String getGuestPhone() {
        return guestPhone;
    }

    public void setGuestPhone(String v) {
        this.guestPhone = v;
    }

    public String getGuestIdNumber() {
        return guestIdNumber;
    }

    public void setGuestIdNumber(String v) {
        this.guestIdNumber = v;
    }

    public String getGuestNationality() {
        return guestNationality;
    }

    public void setGuestNationality(String v) {
        this.guestNationality = v;
    }

    public String getGuestAddress() {
        return guestAddress;
    }

    public void setGuestAddress(String v) {
        this.guestAddress = v;
    }

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer v) {
        this.guestCount = v;
    }

    public String getSpecialRequest() {
        return specialRequest;
    }

    public void setSpecialRequest(String v) {
        this.specialRequest = v;
    }

    public Boolean getEarlyCheckin() {
        return earlyCheckin;
    }

    public void setEarlyCheckin(Boolean v) {
        this.earlyCheckin = v;
    }

    public Boolean getLateCheckout() {
        return lateCheckout;
    }

    public void setLateCheckout(Boolean v) {
        this.lateCheckout = v;
    }

    public LocalDateTime getCheckinTime() {
        return checkinTime;
    }

    public void setCheckinTime(LocalDateTime v) {
        this.checkinTime = v;
    }

    public LocalDateTime getCheckoutTime() {
        return checkoutTime;
    }

    public void setCheckoutTime(LocalDateTime v) {
        this.checkoutTime = v;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime v) {
        this.createdAt = v;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime v) {
        this.updatedAt = v;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer v) {
        this.userId = v;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String v) {
        this.userEmail = v;
    }
}