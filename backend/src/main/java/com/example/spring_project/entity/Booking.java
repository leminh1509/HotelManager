package com.example.spring_project.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "booking")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Booking {

    public enum Status {
        Pending, Confirmed, CheckedIn("Checked-in"), CheckedOut("Checked-out"), Cancelled;

        private final String dbValue;
        Status()              { this.dbValue = name(); }
        Status(String dbVal)  { this.dbValue = dbVal; }

        public String getDbValue() { return dbValue; }

        public static Status fromString(String s) {
            for (Status st : values()) {
                if (st.dbValue.equalsIgnoreCase(s)) return st;
            }
            throw new IllegalArgumentException("Unknown booking status: " + s);
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")  // ✅ FIX: Map rõ ràng với database column
    private Integer bookingId;

    // ── FK: customer ──
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)  // ✅ FIX: snake_case
    private User user;

    // ── FK: room ──
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)  // ✅ FIX: snake_case
    private Room room;

    // ── FK: receptionist (nullable) ──
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receptionist_id")  // ✅ FIX: snake_case
    private User receptionist;

    // ── guest info ──
    @Column(name = "guest_name", length = 100)
    private String guestName;

    @Column(name = "guest_email", length = 100)
    private String guestEmail;

    @Column(name = "guest_phone", length = 20)
    private String guestPhone;

    @Column(name = "guest_id_number", length = 20)
    private String guestIdNumber;

    @Column(name = "guest_nationality", length = 80)
    private String guestNationality;

    @Column(name = "guest_address", length = 255)
    private String guestAddress;

    @Column(name = "guest_count", nullable = false)
    private Integer guestCount = 1;

    @Column(name = "special_request", length = 500)
    private String specialRequest;

    @Column(name = "early_checkin", nullable = false)
    private Boolean earlyCheckin = false;

    @Column(name = "late_checkout", nullable = false)
    private Boolean lateCheckout = false;

    // ── dates ──
    @Column(name = "checkin_time", nullable = false)
    private LocalDate checkinTime;

    @Column(name = "checkout_time", nullable = false)
    private LocalDate checkoutTime;

    // ── status & price ──
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status = Status.Pending;

    @Column(name = "total_price", nullable = false)
    private Double totalPrice = 0.0;

    // ── timestamps ──
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── getters / setters ──
    public Integer        getBookingId()              { return bookingId; }
    public void           setBookingId(Integer v)     { this.bookingId = v; }

    public User           getUser()                   { return user; }
    public void           setUser(User v)             { this.user = v; }

    public Room           getRoom()                   { return room; }
    public void           setRoom(Room v)             { this.room = v; }

    public User           getReceptionist()           { return receptionist; }
    public void           setReceptionist(User v)     { this.receptionist = v; }

    public String         getGuestName()              { return guestName; }
    public void           setGuestName(String v)      { this.guestName = v; }

    public String         getGuestEmail()             { return guestEmail; }
    public void           setGuestEmail(String v)     { this.guestEmail = v; }

    public String         getGuestPhone()             { return guestPhone; }
    public void           setGuestPhone(String v)     { this.guestPhone = v; }

    public String         getGuestIdNumber()          { return guestIdNumber; }
    public void           setGuestIdNumber(String v)  { this.guestIdNumber = v; }

    public String         getGuestNationality()       { return guestNationality; }
    public void           setGuestNationality(String v){ this.guestNationality = v; }

    public String         getGuestAddress()           { return guestAddress; }
    public void           setGuestAddress(String v)   { this.guestAddress = v; }

    public Integer        getGuestCount()             { return guestCount; }
    public void           setGuestCount(Integer v)    { this.guestCount = v; }

    public String         getSpecialRequest()         { return specialRequest; }
    public void           setSpecialRequest(String v) { this.specialRequest = v; }

    public Boolean        getEarlyCheckin()           { return earlyCheckin; }
    public void           setEarlyCheckin(Boolean v)  { this.earlyCheckin = v; }

    public Boolean        getLateCheckout()           { return lateCheckout; }
    public void           setLateCheckout(Boolean v)  { this.lateCheckout = v; }

    public LocalDate  getCheckinTime()            { return checkinTime; }
    public void           setCheckinTime(LocalDate v){ this.checkinTime = v; }

    public LocalDate  getCheckoutTime()           { return checkoutTime; }
    public void           setCheckoutTime(LocalDate v){ this.checkoutTime = v; }

    public Status         getStatus()                 { return status; }
    public void           setStatus(Status v)         { this.status = v; }

    public Double         getTotalPrice()             { return totalPrice; }
    public void           setTotalPrice(Double v)     { this.totalPrice = v; }

    public LocalDateTime  getCreatedAt()              { return createdAt; }
    public void           setCreatedAt(LocalDateTime v){ this.createdAt = v; }

    public LocalDateTime  getUpdatedAt()              { return updatedAt; }
    public void           setUpdatedAt(LocalDateTime v){ this.updatedAt = v; }
}