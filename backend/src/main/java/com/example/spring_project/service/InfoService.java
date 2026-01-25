package com.example.spring_project.service;

import com.example.spring_project.model.Info;
import com.example.spring_project.model.Lession;
import com.example.spring_project.repository.InfoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import com.example.spring_project.model.Info_DTO;
import com.example.spring_project.repository.LessionRepository;

@Service
public class InfoService {
    @Autowired
    private InfoRepository infoRepository;
    @Autowired
    private LessionRepository lessionRepository;



    public List<Info> getAllInfo() {
        return infoRepository.findAll();
    }

    public Info addInfo(Info_DTO dto) {
        Lession lession = lessionRepository.findById(dto.getLessionId())
                .orElseThrow(() -> new RuntimeException("Lession not found with ID: " + dto.getLessionId()));


        Info info = new Info();
        info.setTerm(dto.getTerm());
        info.setDefine(dto.getDefine());
        info.setLession(lession); // Gán entity thật
        return infoRepository.save(info);
    }
    public List<Info> getInfoByLessionId(int id) { return infoRepository.findByLession_Id( id);}
}
