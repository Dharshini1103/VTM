package com.taskmanager.controller;

import com.taskmanager.dto.VoiceCommandDTO;
import com.taskmanager.dto.request.VoiceInputRequest;
import com.taskmanager.dto.response.ApiResponse;
import com.taskmanager.entity.User;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.service.TaskService;
import com.taskmanager.service.VoiceCommandService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/voice")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class VoiceCommandController {

    private final VoiceCommandService voiceCommandService;
    private final TaskService taskService;
    private final ObjectMapper objectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
    private final UserRepository userRepository;

    public VoiceCommandController(VoiceCommandService voiceCommandService, 
                                TaskService taskService,
                                ObjectMapper objectMapper,
    private static final Logger logger = LoggerFactory.getLogger(VoiceCommandController.class);
                                UserRepository userRepository) {
        this.voiceCommandService = voiceCommandService;
        this.taskService = taskService;
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
    }

    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                // Extract the email/username from authentication principal
                String principal = authentication.getName();
                
                // Find the user by email in the database
                User user = userRepository.findByEmail(principal)
                        .or(() -> userRepository.findByGmailId(principal))
                        .orElse(null);
                
                if (user != null) {
                    return user.getId();
                }
                logger.debug("Voice endpoint authentication principal: {}", principal);
            // If we cannot determine the user, throw an exception
            throw new RuntimeException("Unable to determine current user");
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving current user: " + e.getMessage());
        }
                if (user != null) {
                    logger.debug("Resolved voice endpoint user: id={}, email={}", user.getId(), user.getEmail());
                } else {
                    logger.warn("Could not resolve user for principal: {}", principal);
                }
    }

    @PostMapping("/process")
    public ResponseEntity<ApiResponse<VoiceCommandDTO>> processVoiceCommand(@Valid @RequestBody VoiceInputRequest request) {
        Long userId = getCurrentUserId();
        VoiceCommandDTO command = voiceCommandService.processVoiceCommand(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Voice command processed", command));
    }

    @PostMapping("/create-task")
    public ResponseEntity<ApiResponse<Object>> createTaskFromVoice(@Valid @RequestBody VoiceInputRequest request) {
        try {
            Long userId = getCurrentUserId();
            VoiceCommandDTO command = voiceCommandService.processVoiceCommand(userId, request);
            
            // Extract task details from metadata
            if (command.getMetadata() != null && !command.getMetadata().isEmpty()) {
                VoiceCommandService.TaskDetails taskDetails = objectMapper.readValue(
                    command.getMetadata(), 
                    VoiceCommandService.TaskDetails.class
                );
                
                // Create task using extracted details
                Object createdTask = taskService.createTaskFromVoice(userId, taskDetails);
                
                return ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Task created from voice command", createdTask));
            }
            
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Could not extract task details from voice command"));
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error creating task from voice command: " + e.getMessage()));
        }
    }

    @GetMapping("/{commandId}")
    public ResponseEntity<ApiResponse<VoiceCommandDTO>> getVoiceCommand(@PathVariable Long commandId) {
        VoiceCommandDTO command = voiceCommandService.getVoiceCommandById(commandId);
        return ResponseEntity.ok(ApiResponse.success("Voice command retrieved", command));
    }

    @GetMapping("/user/commands")
    public ResponseEntity<ApiResponse<List<VoiceCommandDTO>>> getUserCommands() {
        Long userId = getCurrentUserId();
        List<VoiceCommandDTO> commands = voiceCommandService.getUserVoiceCommands(userId);
        return ResponseEntity.ok(ApiResponse.success("Voice commands retrieved", commands));
    }

    @PostMapping("/{commandId}/mark-processed")
    public ResponseEntity<ApiResponse<Void>> markCommandAsProcessed(@PathVariable Long commandId) {
        voiceCommandService.markCommandAsProcessed(commandId);
        return ResponseEntity.ok(ApiResponse.success("Command marked as processed"));
    }
}
