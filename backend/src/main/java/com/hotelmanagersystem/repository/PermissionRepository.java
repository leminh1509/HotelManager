package com.hotelmanagersystem.repository;

import com.hotelmanagersystem.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
}