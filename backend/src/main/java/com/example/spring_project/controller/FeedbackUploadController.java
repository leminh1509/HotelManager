package com.example.spring_project.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedbacks/upload")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:5173",
        "http://127.0.0.1:5173" })
public class FeedbackUploadController {

    private final String UPLOAD_DIR = "uploads/feedbacks/";

    @PostMapping
    public ResponseEntity<?> uploadFiles(@RequestParam("files") MultipartFile[] files) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            List<String> imageUrls = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file.isEmpty())
                    continue;

                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                String imageUrl = "http://localhost:9999/api/feedbacks/images/" + fileName;
                imageUrls.add(imageUrl);
            }

            return ResponseEntity.ok(Map.of("imageUrls", imageUrls));
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Could not upload files: " + e.getMessage());
        }
    }
}
