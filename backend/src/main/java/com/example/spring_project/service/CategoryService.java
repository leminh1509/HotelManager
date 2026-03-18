package com.example.spring_project.service;

import com.example.spring_project.entity.Category;
import com.example.spring_project.dto.CategoryResponse;
import com.example.spring_project.repository.CategoryRepository;
import com.example.spring_project.util.BookingMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream()
                .map(BookingMapper::toCategoryResponse)
                .collect(Collectors.toList());
    }

    public CategoryResponse getById(Integer id) {
        return categoryRepository.findById(id)
                .map(BookingMapper::toCategoryResponse)
                .orElse(null);
    }
}
