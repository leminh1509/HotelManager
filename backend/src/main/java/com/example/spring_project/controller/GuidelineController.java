package com.example.spring_project.controller;

import com.example.spring_project.entity.Guideline;
import com.example.spring_project.service.GuidelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/guidelines")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"})
public class GuidelineController {

    @Autowired
    private GuidelineService guidelineService;

    @GetMapping
    public Page<Guideline> getAllGuidelines(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return guidelineService.getPaginatedGuidelines(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Guideline> getGuidelineById(@PathVariable Integer id) {
        Optional<Guideline> guideline = guidelineService.getGuidelineById(id);
        return guideline.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Guideline createGuideline(@RequestBody Guideline guideline) {
        return guidelineService.createGuideline(guideline);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Guideline> updateGuideline(@PathVariable Integer id, @RequestBody Guideline guidelineDetails) {
        Guideline updatedGuideline = guidelineService.updateGuideline(id, guidelineDetails);
        if (updatedGuideline != null) {
            return ResponseEntity.ok(updatedGuideline);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGuideline(@PathVariable Integer id) {
        if (guidelineService.deleteGuideline(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
