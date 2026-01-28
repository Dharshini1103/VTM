package com.taskmanager.service;

import com.taskmanager.dto.VoiceCommandDTO;
import com.taskmanager.dto.request.VoiceInputRequest;
import com.taskmanager.entity.VoiceCommand;
import com.taskmanager.entity.User;
import com.taskmanager.exception.ResourceNotFoundException;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.repository.VoiceCommandRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
@SuppressWarnings("null")
public class VoiceCommandService {

    private static final Logger logger = LoggerFactory.getLogger(VoiceCommandService.class);

    private final VoiceCommandRepository voiceCommandRepository;
    private final UserRepository userRepository;

    public VoiceCommandService(VoiceCommandRepository voiceCommandRepository,
                             UserRepository userRepository) {
        this.voiceCommandRepository = voiceCommandRepository;
        this.userRepository = userRepository;
    }

    public VoiceCommandDTO processVoiceCommand(Long userId, VoiceInputRequest request) {
        logger.info("Processing voice command for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String text = request.getText().toLowerCase().trim();
        VoiceCommand.CommandIntent intent = detectIntent(text);

        VoiceCommand command = VoiceCommand.builder()
                .user(user)
                .voiceInput(request.getText())
                .textOutput(text)
                .intent(intent)
                .taskId(request.getTaskId())
                .confidenceScore(calculateConfidenceScore(text, intent))
                .processedSuccessfully(false)
                .createdAt(LocalDateTime.now())
                .build();

        VoiceCommand savedCommand = voiceCommandRepository.save(command);
        logger.info("Voice command saved with ID: {}", savedCommand.getId());

        return VoiceCommandDTO.fromEntity(savedCommand);
    }

    public VoiceCommand.CommandIntent detectIntent(String text) {
        text = text.toLowerCase().trim();

        // Schedule call/meeting patterns
        if (matchesPattern(text, "schedule.*(?:call|meeting|meet|google meet|zoom|teams)")) {
            if (matchesPattern(text, "google meet")) {
                return VoiceCommand.CommandIntent.SCHEDULE_MEETING;
            } else if (matchesPattern(text, "(?:phone|call)")) {
                return VoiceCommand.CommandIntent.SCHEDULE_CALL;
            } else {
                return VoiceCommand.CommandIntent.SCHEDULE_MEETING;
            }
        }

        // Create task pattern
        if (matchesPattern(text, "(?:create|add|new).*task")) {
            return VoiceCommand.CommandIntent.CREATE_TASK;
        }

        // Update task pattern
        if (matchesPattern(text, "(?:update|modify|change).*task")) {
            return VoiceCommand.CommandIntent.UPDATE_TASK;
        }

        // Complete task pattern
        if (matchesPattern(text, "(?:mark|complete|finish|done).*task")) {
            return VoiceCommand.CommandIntent.MARK_COMPLETE;
        }

        // Assign task pattern
        if (matchesPattern(text, "(?:assign|give).*task.*(?:to|for)")) {
            return VoiceCommand.CommandIntent.ASSIGN_TASK;
        }

        // Default: No matching intent (just voice-to-text conversion)
        return VoiceCommand.CommandIntent.NONE;
    }

    private boolean matchesPattern(String text, String pattern) {
        Pattern p = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(text);
        return m.find();
    }

    private Double calculateConfidenceScore(String text, VoiceCommand.CommandIntent intent) {
        if (intent == VoiceCommand.CommandIntent.NONE) {
            return 0.5;
        }

        // Calculate confidence based on keyword match strength
        double confidence = 0.7; // Base confidence

        // Increase confidence if keywords are explicitly present
        if (matchesPattern(text, "(?:schedule|book|arrange)")) {
            confidence += 0.15;
        }

        // Increase confidence based on specificity
        if (matchesPattern(text, "(?:tomorrow|today|next week|at \\d{1,2}(?:am|pm))")) {
            confidence += 0.1;
        }

        return Math.min(confidence, 0.99);
    }

    public VoiceCommandDTO getVoiceCommandById(Long commandId) {
        VoiceCommand command = voiceCommandRepository.findById(commandId)
                .orElseThrow(() -> new ResourceNotFoundException("Voice command not found"));
        return VoiceCommandDTO.fromEntity(command);
    }

    public List<VoiceCommandDTO> getUserVoiceCommands(Long userId) {
        return voiceCommandRepository.findByUserId(userId).stream()
                .map(VoiceCommandDTO::fromEntity)
                .toList();
    }

    public List<VoiceCommandDTO> getCommandsByIntent(VoiceCommand.CommandIntent intent) {
        return voiceCommandRepository.findByIntent(intent).stream()
                .map(VoiceCommandDTO::fromEntity)
                .toList();
    }

    public void markCommandAsProcessed(Long commandId) {
        VoiceCommand command = voiceCommandRepository.findById(commandId)
                .orElseThrow(() -> new ResourceNotFoundException("Voice command not found"));
        command.setProcessedSuccessfully(true);
        voiceCommandRepository.save(command);
        logger.info("Voice command marked as processed: {}", commandId);
    }
}
