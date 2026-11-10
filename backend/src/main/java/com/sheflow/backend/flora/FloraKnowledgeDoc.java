package com.sheflow.backend.flora;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloraKnowledgeDoc {
    private String docId;
    private String title;
    private String publisher;
    private String medicalReviewDate;
    private String category;
    private String content;
    private String citationUrl;
    private List<String> keywords;
}
