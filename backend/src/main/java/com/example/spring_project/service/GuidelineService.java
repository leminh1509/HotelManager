package com.example.spring_project.service;

import com.example.spring_project.entity.Guideline;
import com.example.spring_project.repository.GuidelineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GuidelineService {

    @Autowired
    private GuidelineRepository guidelineRepository;

    public List<Guideline> getAllGuidelines() {
        return guidelineRepository.findAll();
    }

    public Optional<Guideline> getGuidelineById(Integer id) {
        return guidelineRepository.findById(id);
    }

    public Guideline createGuideline(Guideline guideline) {
        return guidelineRepository.save(guideline);
    }

    public Guideline updateGuideline(Integer id, Guideline guidelineDetails) {
        Optional<Guideline> optionalGuideline = guidelineRepository.findById(id);
        if (optionalGuideline.isPresent()) {
            Guideline existingGuideline = optionalGuideline.get();
            existingGuideline.setTitle(guidelineDetails.getTitle());
            existingGuideline.setContent(guidelineDetails.getContent());
            return guidelineRepository.save(existingGuideline);
        }
        return null;
    }

    public boolean deleteGuideline(Integer id) {
        if (guidelineRepository.existsById(id)) {
            guidelineRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
