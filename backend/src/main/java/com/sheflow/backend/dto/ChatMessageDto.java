package com.sheflow.backend.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private Long id;
    private String sender; // USER or FLORA
    private String content;
    private String timestamp;
    private List<String> sources;
    private String safetyNotice;
    private Boolean isEmergency;
}
