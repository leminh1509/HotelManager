package com.example.spring_project.dto;


import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

/**
 * Client gửi lên khi đặt phòng mới.
 * Validation annotation map với các field bắt buộc trong hms_db.
 */
public class BookingCreateRequest {

    @NotNull(message = "roomId is required")
    private Integer roomId;

    // ── dates ──
    // ── dates ──
    @NotNull(message = "checkinTime is required")
    private LocalDateTime checkinTime;

    @NotNull(message = "checkoutTime is required")
    private LocalDateTime checkoutTime;

    // ── guest ──
    @NotNull(message = "guestCount is required")
    @Min(value = 1, message = "guestCount must be >= 1")
    private Integer guestCount;

    @NotBlank(message = "guestName is required")
    @Size(max = 100)
    private String guestName;

    @Size(max = 100)
    private String guestEmail;

    @NotBlank(message = "guestPhone is required")
    @Size(max = 20)
    private String guestPhone;

    @NotBlank(message = "guestIdNumber is required")
    @Size(max = 20)
    private String guestIdNumber;

    @Size(max = 80)
    private String guestNationality;

    @Size(max = 255)
    private String guestAddress;

    @Size(max = 500)
    private String specialRequest;

    private Boolean earlyCheckin  = false;
    private Boolean lateCheckout  = false;

    // ── getters / setters ──
    public Integer        getRoomId()              { return roomId; }
    public void           setRoomId(Integer v)     { this.roomId = v; }
    public LocalDateTime  getCheckinTime()         { return checkinTime; }
    public void           setCheckinTime(LocalDateTime v){ this.checkinTime = v; }
    public LocalDateTime  getCheckoutTime()        { return checkoutTime; }
    public void           setCheckoutTime(LocalDateTime v){ this.checkoutTime = v; }
    public Integer        getGuestCount()          { return guestCount; }
    public void           setGuestCount(Integer v) { this.guestCount = v; }
    public String         getGuestName()           { return guestName; }
    public void           setGuestName(String v)   { this.guestName = v; }
    public String         getGuestEmail()          { return guestEmail; }
    public void           setGuestEmail(String v)  { this.guestEmail = v; }
    public String         getGuestPhone()          { return guestPhone; }
    public void           setGuestPhone(String v)  { this.guestPhone = v; }
    public String         getGuestIdNumber()       { return guestIdNumber; }
    public void           setGuestIdNumber(String v){ this.guestIdNumber = v; }
    public String         getGuestNationality()    { return guestNationality; }
    public void           setGuestNationality(String v){ this.guestNationality = v; }
    public String         getGuestAddress()        { return guestAddress; }
    public void           setGuestAddress(String v){ this.guestAddress = v; }
    public String         getSpecialRequest()      { return specialRequest; }
    public void           setSpecialRequest(String v){ this.specialRequest = v; }
    public Boolean        getEarlyCheckin()        { return earlyCheckin; }
    public void           setEarlyCheckin(Boolean v){ this.earlyCheckin = v; }
    public Boolean        getLateCheckout()        { return lateCheckout; }
    public void           setLateCheckout(Boolean v){ this.lateCheckout = v; }
}
