package com.example.spring_project.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "lession")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Lession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lession_id")
    private Long id;

    @Column(name = "lession_name", nullable = false)
    private String name;

    @OneToMany(mappedBy = "lession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Info> infoList;
}
