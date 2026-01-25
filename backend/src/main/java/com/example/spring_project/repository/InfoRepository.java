package com.example.spring_project.repository;

import com.example.spring_project.model.Info;
import com.example.spring_project.model.Lession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InfoRepository extends JpaRepository<Info, Integer> {
    List<Info> findByLession(Lession lession); // ✅ Tìm theo đối tượng Lession
    List<Info> findByLession_Id(int lessionId); // ✅ Tìm theo ID của Lession

}
