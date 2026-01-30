package com.example.spring_project.controller;

import com.example.spring_project.model.Info;
import com.example.spring_project.service.InfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.spring_project.model.Info_DTO;

import java.util.List;

@RestController
@RequestMapping("/api/info")
@CrossOrigin(origins = "http://localhost:3000") // Cho phép React truy cập API
public class InfoController {
    @Autowired
    private InfoService infoService;

    @GetMapping("/all")
    public List<Info> getAllInfo() {
        return infoService.getAllInfo();
    }

    @GetMapping("/{id}")
    public List<Info> getInfoByLessionID(@PathVariable Long id) {
        return infoService.getInfoByLessionId(id);
    }

    @PostMapping
    public Info addInfo(@RequestBody Info_DTO info) {
        return infoService.addInfo(info);
    }
}
