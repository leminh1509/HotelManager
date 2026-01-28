package com.example.spring_project.model;

public class Info_DTO {

    private String term;
    private String define;
    private Long lessionId;

    public String getTerm() {
        return term;
    }

    public void setTerm(String term) {
        this.term = term;
    }

    public String getDefine() {
        return define;
    }

    public void setDefine(String define) {
        this.define = define;
    }

    public Long getLessionId() {
        return lessionId;
    }

    public void setLessionId(Long lessionId) {
        this.lessionId = lessionId;
    }
}
