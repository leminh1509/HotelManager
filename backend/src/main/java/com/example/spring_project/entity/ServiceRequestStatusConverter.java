package com.example.spring_project.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ServiceRequestStatusConverter implements AttributeConverter<ServiceRequestStatus, String> {

    @Override
    public String convertToDatabaseColumn(ServiceRequestStatus status) {
        if (status == null) {
            return null;
        }
        return status.getValue();
    }

    @Override
    public ServiceRequestStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return ServiceRequestStatus.fromValue(dbData);
    }
}
