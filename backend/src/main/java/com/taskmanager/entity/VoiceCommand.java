package com.taskmanager.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "voice_commands")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    @Builder.Default
    private Boolean processedSuccessfully = false;

    @Column(nullable = false)
    @Builder.Default
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
}
