package com.example.spring_project.controller;

import com.example.spring_project.entity.Rule;
import com.example.spring_project.service.RuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/rules")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"})
public class RuleController {

    @Autowired
    private RuleService ruleService;

    @GetMapping
    public Page<Rule> getAllRules(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ruleService.getPaginatedRules(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rule> getRuleById(@PathVariable Integer id) {
        Optional<Rule> rule = ruleService.getRuleById(id);
        return rule.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Rule createRule(@RequestBody Rule rule) {
        return ruleService.createRule(rule);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Rule> updateRule(@PathVariable Integer id, @RequestBody Rule ruleDetails) {
        Rule updatedRule = ruleService.updateRule(id, ruleDetails);
        if (updatedRule != null) {
            return ResponseEntity.ok(updatedRule);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Integer id) {
        if (ruleService.deleteRule(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
