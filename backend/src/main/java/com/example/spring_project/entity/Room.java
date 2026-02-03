package com.example.spring_project.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "room")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Integer roomId;

    @Column(name = "room_number", length = 20, nullable = false, unique = true)
    private String roomNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private RoomStatus status;

    @Column(name = "price", nullable = false)
    private Double price;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "floor")
    private Integer floor;

    @Column(name = "size_m2")
    private Double sizem2;

    @Column(name = "bed_configuration", length = 100)
    private String bedConfiguration;

    @Column(name = "cancellation_policy", length = 300)
    private String cancellationPolicy;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "img_url", length = 255)
    private String imgUrl;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── getters / setters ──
    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String v) {
        this.roomNumber = v;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category v) {
        this.category = v;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus v) {
        this.status = v;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double v) {
        this.price = v;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer v) {
        this.capacity = v;
    }

    public Integer getFloor() {
        return floor;
    }

    public void setFloor(Integer v) {
        this.floor = v;
    }

    public Double getSizem2() {
        return sizem2;
    }

    public void setSizem2(Double v) {
        this.sizem2 = v;
    }

    public String getBedConfiguration() {
        return bedConfiguration;
    }

    public void setBedConfiguration(String v) {
        this.bedConfiguration = v;
    }

    public String getCancellationPolicy() {
        return cancellationPolicy;
    }

    public void setCancellationPolicy(String v) {
        this.cancellationPolicy = v;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String v) {
        this.description = v;
    }

    public String getImgUrl() {
        return imgUrl;
    }

    public void setImgUrl(String v) {
        this.imgUrl = v;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime v) {
        this.updatedAt = v;
    }
}