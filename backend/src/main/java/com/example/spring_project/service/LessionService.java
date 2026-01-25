package com.example.spring_project.service;
import com.example.spring_project.model.Lession;
import com.example.spring_project.repository.LessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LessionService {
    @Autowired
    private LessionRepository lessionRepository;

    public List<Lession> getAllLessions() {
        return lessionRepository.findAll();
    }

    public Lession addLession(Lession lession) {
        return lessionRepository.save(lession);
    }
}

