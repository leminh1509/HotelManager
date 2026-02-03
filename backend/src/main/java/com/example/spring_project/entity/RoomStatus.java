package com.example.spring_project.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "room_status")
public class RoomStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "status_id")  // ✅ FIX: Map rõ ràng với database column
    private Integer statusId;

    @Column(name = "name", length = 30, nullable = false, unique = true)
    private String name;

    public Integer getStatusId()            { return statusId; }
    public void    setStatusId(Integer v)   { this.statusId = v; }
    public String  getName()                { return name; }
    public void    setName(String v)        { this.name = v; }
}