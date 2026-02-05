package com.taskmanager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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
public class VoiceCommandService {

    private static final Logger logger = LoggerFactory.getLogger(VoiceCommandService.class);

    private final VoiceCommandRepository voiceCommandRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public VoiceCommandService(VoiceCommandRepository voiceCommandRepository,
                             UserRepository userRepository,
                             ObjectMapper objectMapper) {
        this.voiceCommandRepository = voiceCommandRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    // Task details class for voice extraction
    public static class TaskDetails {
        private String title;
        private String description;
        private String priority;
        private String assignedTo;
        private String dueDate;
        private String status;

        public TaskDetails() {}

        // Getters and setters
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }

        public String getAssignedTo() { return assignedTo; }
        public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

        public String getDueDate() { return dueDate; }
        public void setDueDate(String dueDate) { this.dueDate = dueDate; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public VoiceCommandDTO processVoiceCommand(Long userId, VoiceInputRequest request) {
        logger.info("Processing voice command for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String text = request.getText().toLowerCase().trim();
        VoiceCommand.CommandIntent intent = detectIntent(text);
        
        // Extract task details from voice command
        TaskDetails taskDetails = extractTaskDetails(text, intent);

        VoiceCommand command = new VoiceCommand();
        command.setUser(user);
        command.setVoiceInput(request.getText());
        command.setTextOutput(text);
        command.setIntent(intent);
        command.setTaskId(request.getTaskId());
        command.setConfidenceScore(calculateConfidenceScore(text, intent));
        command.setProcessedSuccessfully(false);
        command.setCreatedAt(LocalDateTime.now());
        
        // Store extracted task details as metadata
        command.setMetadata(convertTaskDetailsToJson(taskDetails));

        VoiceCommand savedCommand = voiceCommandRepository.save(command);
        logger.info("Voice command saved with ID: {} and extracted task details", savedCommand.getId());

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

    // Extract task details from voice command
    private TaskDetails extractTaskDetails(String text, VoiceCommand.CommandIntent intent) {
        TaskDetails details = new TaskDetails();
        
        // Extract task title
        details.setTitle(extractTaskTitle(text));
        
        // Extract description
        details.setDescription(extractDescription(text));
        
        // Extract priority
        details.setPriority(extractPriority(text));
        
        // Extract assigned user
        details.setAssignedTo(extractAssignedUser(text));
        
        // Extract due date
        details.setDueDate(extractDueDate(text));
        
        // Set default status
        details.setStatus("TODO");
        
        return details;
    }

    private String extractTaskTitle(String text) {
        // Look for patterns like "create task called X" or "new task X"
        Pattern titlePattern = Pattern.compile("(?:task called|create task|new task|task named)\\s+[\"']?([^\"'\\.]+)[\"']?", Pattern.CASE_INSENSITIVE);
        Matcher matcher = titlePattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        // Fallback: look for first sentence or phrase
        String[] sentences = text.split("\\.|\\!|\\?");
        if (sentences.length > 0) {
            return sentences[0].trim();
        }
        
        return "New Task";
    }

    private String extractDescription(String text) {
        // Look for description patterns
        Pattern descPattern = Pattern.compile("(?:description|describe|details?)\\s+[\"']?([^\"'\\.]+)[\"']?", Pattern.CASE_INSENSITIVE);
        Matcher matcher = descPattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        // Use full text as description if no specific pattern found
        return text;
    }

    private String extractPriority(String text) {
        if (matchesPattern(text, "(?:high|urgent|critical|important)")) {
            return "HIGH";
        } else if (matchesPattern(text, "(?:medium|normal|regular)")) {
            return "MEDIUM";
        } else if (matchesPattern(text, "(?:low|minor|later)")) {
            return "LOW";
        }
        return "MEDIUM"; // Default
    }

    private String extractAssignedUser(String text) {
        // Look for email patterns
        Pattern emailPattern = Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b");
        Matcher emailMatcher = emailPattern.matcher(text);
        if (emailMatcher.find()) {
            return emailMatcher.group(0);
        }
        
        // Look for name patterns like "assign to John" or "give to Sarah"
        Pattern namePattern = Pattern.compile("(?:assign|give)\\s+(?:to|for)\\s+([A-Za-z]+(?:\\s+[A-Za-z]+)?)", Pattern.CASE_INSENSITIVE);
        Matcher nameMatcher = namePattern.matcher(text);
        if (nameMatcher.find()) {
            return nameMatcher.group(1).trim();
        }
        
        return null; // No assignment found
    }

    private String extractDueDate(String text) {
        // Look for date patterns
        if (matchesPattern(text, "(?:today|now)")) {
            return "TODAY";
        } else if (matchesPattern(text, "(?:tomorrow|tmrw)")) {
            return "TOMORROW";
        } else if (matchesPattern(text, "(?:next week|next wk)")) {
            return "NEXT_WEEK";
        } else if (matchesPattern(text, "\\d{1,2}\\s+(?:days?|weeks?|months?)")) {
            return "FUTURE";
        }
        
        return null; // No due date found
    }

    private String convertTaskDetailsToJson(TaskDetails details) {
        try {
            return objectMapper.writeValueAsString(details);
        } catch (Exception e) {
            logger.error("Error converting task details to JSON", e);
            return "{}";
        }
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

    public void deleteVoiceCommand(Long commandId, Long requestingUserId) {
        VoiceCommand command = voiceCommandRepository.findById(commandId)
                .orElseThrow(() -> new ResourceNotFoundException("Voice command not found"));

        User requester = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Requesting user not found"));

        boolean isOwner = command.getUser() != null && command.getUser().getId().equals(requestingUserId);
        boolean isAdmin = requester.getRole() == User.UserRole.ADMIN || requester.getRole() == User.UserRole.SUPER_ADMIN;

        if (!isOwner && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to delete this command");
        }

        voiceCommandRepository.delete(command);
        logger.info("Voice command deleted: {} by user {}", commandId, requestingUserId);
    }
}
