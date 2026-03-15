package com.example.spring_project.repository;

import com.example.spring_project.entity.Guideline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GuidelineRepository extends JpaRepository<Guideline, Integer> {
}
