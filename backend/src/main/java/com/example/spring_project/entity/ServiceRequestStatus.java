package com.example.spring_project.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ServiceRequestStatus {
    New("New"),
    In_Progress("In Progress"),
    On_Hold("On Hold"),
    Completed("Completed"),
    Rejected("Rejected"),
    Cancelled("Cancelled");

    private final String value;

    ServiceRequestStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static ServiceRequestStatus fromValue(String value) {
        if (value == null || value.isEmpty() || value.equals("0")) {
            return New; // Handle MySQL invalid ENUM marker ("0") gracefully
        }
        for (ServiceRequestStatus status : ServiceRequestStatus.values()) {
            if (status.value.equalsIgnoreCase(value) || status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        return New; // Default fallback for any unknown value
    }

    @Override
    public String toString() {
        return value;
    }
}
