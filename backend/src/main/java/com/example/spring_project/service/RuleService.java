package com.example.spring_project.service;

import com.example.spring_project.entity.Rule;
import com.example.spring_project.repository.RuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RuleService {

    @Autowired
    private RuleRepository ruleRepository;

    public List<Rule> getAllRules() {
        return ruleRepository.findAll();
    }

    public Optional<Rule> getRuleById(Integer id) {
        return ruleRepository.findById(id);
    }

    public Rule createRule(Rule rule) {
        return ruleRepository.save(rule);
    }

    public Rule updateRule(Integer id, Rule ruleDetails) {
        Optional<Rule> optionalRule = ruleRepository.findById(id);
        if (optionalRule.isPresent()) {
            Rule existingRule = optionalRule.get();
            existingRule.setTitle(ruleDetails.getTitle());
            existingRule.setContent(ruleDetails.getContent());
            return ruleRepository.save(existingRule);
        }
        return null;
    }

    public boolean deleteRule(Integer id) {
        if (ruleRepository.existsById(id)) {
            ruleRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
