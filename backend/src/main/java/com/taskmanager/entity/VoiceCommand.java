package com.taskmanager.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "voice_commands")
public class VoiceCommand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String voiceInput;

    @Column(columnDefinition = "TEXT")
    private String textOutput;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommandIntent intent;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "task_id")
    private Long taskId;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "processed_successfully")
    private Boolean processedSuccessfully = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum CommandIntent {
        CREATE_TASK,
        UPDATE_TASK,
        SCHEDULE_CALL,
        SCHEDULE_MEETING,
        MARK_COMPLETE,
        ASSIGN_TASK,
        NONE
    }

    public VoiceCommand() {}

    public VoiceCommand(Long id, User user, String voiceInput, String textOutput, 
                       CommandIntent intent, Double confidenceScore, Long taskId, 
                       String metadata, Boolean processedSuccessfully, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
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

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getVoiceInput() { return voiceInput; }
    public void setVoiceInput(String voiceInput) { this.voiceInput = voiceInput; }

    public String getTextOutput() { return textOutput; }
    public void setTextOutput(String textOutput) { this.textOutput = textOutput; }

    public CommandIntent getIntent() { return intent; }
    public void setIntent(CommandIntent intent) { this.intent = intent; }

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
}
