package com.taskmanager.dto.request;

import jakarta.validation.constraints.NotBlank;

public class VoiceInputRequest {
    
    @NotBlank(message = "Voice input text is required")
    private String text;
    
    private Long taskId;
    
    private String audioBase64;
    
    // Getters and setters
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    
    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
    
    public String getAudioBase64() { return audioBase64; }
    public void setAudioBase64(String audioBase64) { this.audioBase64 = audioBase64; }
}
