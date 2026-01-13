package com.hotelmanagersystem.repository;


import com.hotelmanagersystem.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
}