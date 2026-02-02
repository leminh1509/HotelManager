// package com.example.spring_project.entity;


// import jakarta.persistence.*;
// import java.time.LocalDateTime;

// @Entity
// @Table(name = "category")
// public class Category {

//     @Id
//     @GeneratedValue(strategy = GenerationType.IDENTITY)
//     private Integer categoryId;

//     @Column(name = "name", length = 100, nullable = false, unique = true)
//     private String name;

//     @Column(name = "description", length = 500)
//     private String description;

//     @Column(name = "imgUrl", length = 255)
//     private String imgUrl;

//     @Column(name = "updatedAt")
//     private LocalDateTime updatedAt;

//     // ── getters / setters ──
//     public Integer      getCategoryId()            { return categoryId; }
//     public void         setCategoryId(Integer v)   { this.categoryId = v; }
//     public String       getName()                  { return name; }
//     public void         setName(String v)          { this.name = v; }
//     public String       getDescription()           { return description; }
//     public void         setDescription(String v)   { this.description = v; }
//     public String       getImgUrl()                { return imgUrl; }
//     public void         setImgUrl(String v)        { this.imgUrl = v; }
//     public LocalDateTime getUpdatedAt()            { return updatedAt; }
//     public void         setUpdatedAt(LocalDateTime v){ this.updatedAt = v; }
// }