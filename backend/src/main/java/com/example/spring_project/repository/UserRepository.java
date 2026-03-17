package com.example.spring_project.repository;

import com.example.spring_project.entity.Role;
import com.example.spring_project.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
        Optional<User> findByEmail(String email);

        Boolean existsByEmail(String email);

        Boolean existsByMobilePhone(String mobilePhone);

        List<User> findByRole_Name(String roleName);

        List<User> findByRole(Role role);

        Page<User> findByRole_Name(String roleName, Pageable pageable);

        Long countByRole_Name(String roleName);

        Long countByIsActiveTrue();

        Long countByIsBlackListTrue();

        List<User> findByIsActiveTrue();

        @Query("SELECT u FROM User u WHERE " +
                        "(:roleName IS NULL OR u.role.name = :roleName) AND " +
                        "(:keyword IS NULL OR " +
                        " LOWER(u.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        " LOWER(u.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        " LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        " LOWER(u.mobilePhone) LIKE LOWER(CONCAT('%', :keyword, '%'))) ")
        Page<User> searchUsers(
                        @Param("roleName") String roleName,
                        @Param("keyword") String keyword,
                        Pageable pageable);
}