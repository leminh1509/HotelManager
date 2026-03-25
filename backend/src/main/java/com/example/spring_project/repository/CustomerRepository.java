package com.example.spring_project.repository;

import com.example.spring_project.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    
    @Query(value = """
        SELECT 
            c.name, 
            c.email, 
            c.phone, 
            c.id_number, 
            c.nationality,
            (SELECT COUNT(*) > 0 FROM booking b WHERE b.customer_id = c.customer_id AND b.status IN ('Confirmed', 'Checked-in')) as has_active_booking,
            c.customer_id
        FROM customer c
        WHERE (:name IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%')))
          AND (:phone IS NULL OR c.phone LIKE CONCAT('%', :phone, '%'))
          AND (:idNumber IS NULL OR c.id_number LIKE CONCAT('%', :idNumber, '%'))
    """, countQuery = """
        SELECT COUNT(*) FROM customer c
        WHERE (:name IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%')))
          AND (:phone IS NULL OR c.phone LIKE CONCAT('%', :phone, '%'))
          AND (:idNumber IS NULL OR c.id_number LIKE CONCAT('%', :idNumber, '%'))
    """, nativeQuery = true)
    Page<Object[]> findUniqueGuests(
            @Param("name") String name,
            @Param("phone") String phone,
            @Param("idNumber") String idNumber,
            Pageable pageable);

    Optional<Customer> findByNameAndPhoneAndIdNumber(String name, String phone, String idNumber);
}
