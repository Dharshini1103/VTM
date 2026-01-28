package com.taskmanager.dto;

import com.taskmanager.entity.VoiceCommand;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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

    public static VoiceCommandDTO fromEntity(VoiceCommand command) {
        return VoiceCommandDTO.builder()
                .id(command.getId())
                .userId(command.getUser().getId())
                .voiceInput(command.getVoiceInput())
                .textOutput(command.getTextOutput())
                .intent(command.getIntent())
                .confidenceScore(command.getConfidenceScore())
                .taskId(command.getTaskId())
                .metadata(command.getMetadata())
                .processedSuccessfully(command.getProcessedSuccessfully())
                .createdAt(command.getCreatedAt())
                .build();
    }
}
