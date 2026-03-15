package com.example.spring_project.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class Googleauthrequest {
    @NotBlank(message = "ID token is required")
    private String idToken;
}
