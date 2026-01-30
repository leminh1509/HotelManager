package com.example.spring_project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {


    private Integer userId;
    private String firstName;
    private String middleName;
    private String lastName;
    private String email;
    private String mobilePhone;
    private LocalDate birthday;
    private String avatarUrl;

    private Integer roleId;
    private String roleName;

    private Boolean isActive;
    private Boolean isBlackList;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}