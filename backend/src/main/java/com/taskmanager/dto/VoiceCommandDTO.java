package com.taskmanager.dto;

import com.taskmanager.entity.VoiceCommand;
import java.time.LocalDateTime;

public class VoiceCommandDTO {
    private Long id;
    private Long userId;
    private String voiceInput;
    private String textOutput;
    private VoiceCommand.CommandIntent intent;
    private Double confidenceScore;
    private Long taskId;
    private String metadata;
    private Boolean processedSuccessfully;
    private LocalDateTime createdAt;

    public VoiceCommandDTO() {}

    public VoiceCommandDTO(Long id, Long userId, String voiceInput, String textOutput, 
                          VoiceCommand.CommandIntent intent, Double confidenceScore, 
                          Long taskId, String metadata, Boolean processedSuccessfully, 
                          LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.voiceInput = voiceInput;
        this.textOutput = textOutput;
        this.intent = intent;
        this.confidenceScore = confidenceScore;
        this.taskId = taskId;
        this.metadata = metadata;
        this.processedSuccessfully = processedSuccessfully;
        this.createdAt = createdAt;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getVoiceInput() { return voiceInput; }
    public void setVoiceInput(String voiceInput) { this.voiceInput = voiceInput; }

    public String getTextOutput() { return textOutput; }
    public void setTextOutput(String textOutput) { this.textOutput = textOutput; }

    public VoiceCommand.CommandIntent getIntent() { return intent; }
    public void setIntent(VoiceCommand.CommandIntent intent) { this.intent = intent; }

    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public Boolean getProcessedSuccessfully() { return processedSuccessfully; }
    public void setProcessedSuccessfully(Boolean processedSuccessfully) { this.processedSuccessfully = processedSuccessfully; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static VoiceCommandDTO fromEntity(VoiceCommand command) {
        return new VoiceCommandDTO(
                command.getId(),
                command.getUser().getId(),
                command.getVoiceInput(),
                command.getTextOutput(),
                command.getIntent(),
                command.getConfidenceScore(),
                command.getTaskId(),
                command.getMetadata(),
                command.getProcessedSuccessfully(),
                command.getCreatedAt()
        );
    }
}
