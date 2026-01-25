package com.example.spring_project.controller;

import com.example.spring_project.model.Lession;
import com.example.spring_project.service.LessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lessions")
@CrossOrigin(origins = "http://localhost:3000") // Cho phép React truy cập API
public class LessionController {
    @Autowired
    private LessionService lessionService;

    @GetMapping
    public List<Lession> getAllLessions() {
        return lessionService.getAllLessions();
    }

    @PostMapping
    public Lession addLession(@RequestBody Lession lession) {
        return lessionService.addLession(lession);
    }
}
