package com.example.spring_project.model;
import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class Info {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "info_id")
    private Long id;

    @Column(name = "term", nullable = false)
    private String term;

    @Column(name = "define", nullable = false)
    private String define;

    @ManyToOne
    @JoinColumn(name = "lession_id", nullable = false)
    @JsonIgnore
    private Lession lession;
}