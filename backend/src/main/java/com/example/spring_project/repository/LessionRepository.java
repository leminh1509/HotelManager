package com.example.spring_project.repository;

import com.example.spring_project.model.Lession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LessionRepository extends JpaRepository<Lession, Long> {

}
