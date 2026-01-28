package com.taskmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VoiceInputRequest {
    
    @NotBlank(message = "Voice input text is required")
    private String text;
    
    private Long taskId;
    
    private String audioBase64;
}
