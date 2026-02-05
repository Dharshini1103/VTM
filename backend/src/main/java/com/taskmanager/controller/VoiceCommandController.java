package com.taskmanager.controller;

import com.taskmanager.dto.VoiceCommandDTO;
import com.taskmanager.dto.request.VoiceInputRequest;
import com.taskmanager.dto.response.ApiResponse;
import com.taskmanager.entity.User;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.service.TaskService;
import com.taskmanager.service.GoogleCalendarService;
import com.taskmanager.dto.request.ScheduleCallRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import com.taskmanager.service.VoiceCommandService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(VoiceCommandController.class);

    private final VoiceCommandService voiceCommandService;
    private final TaskService taskService;
    private final GoogleCalendarService googleCalendarService;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    public VoiceCommandController(VoiceCommandService voiceCommandService, 
                                TaskService taskService,
                                GoogleCalendarService googleCalendarService,
                                ObjectMapper objectMapper,
                                UserRepository userRepository) {
        this.voiceCommandService = voiceCommandService;
        this.taskService = taskService;
        this.googleCalendarService = googleCalendarService;
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
    }

    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                // Extract the email/username from authentication principal
                String principal = authentication.getName();
                logger.debug("Voice endpoint authentication principal: {}", principal);
                
                // Find the user by email in the database
                User user = userRepository.findByEmail(principal)
                        .or(() -> userRepository.findByGmailId(principal))
                        .orElse(null);
                
                if (user != null) {
                    logger.debug("Resolved voice endpoint user: id={}, email={}", user.getId(), user.getEmail());
                    return user.getId();
                } else {
                    logger.warn("Could not resolve user for principal: {}", principal);
                }
            }
            // If we cannot determine the user, throw an exception
            throw new RuntimeException("Unable to determine current user");
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving current user: " + e.getMessage());
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

    @PostMapping("/schedule-call")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Object>> scheduleCallFromVoice(@Valid @RequestBody ScheduleCallRequest request) {
        try {
            Long userId = getCurrentUserId();
            User organizer = userRepository.findById(userId).orElse(null);
            String organizerEmail = organizer != null ? organizer.getEmail() : null;

            java.time.ZonedDateTime start = java.time.ZonedDateTime.parse(request.getStartDateTime());
            java.time.ZonedDateTime end = java.time.ZonedDateTime.parse(request.getEndDateTime());

            GoogleCalendarService.ScheduledCallResult result = googleCalendarService.scheduleCall(
                    organizerEmail,
                    request.getAttendees(),
                    request.getTitle(),
                    start,
                    end
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Call scheduled", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error scheduling call: " + e.getMessage()));
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

    @DeleteMapping("/{commandId}")
    public ResponseEntity<ApiResponse<Void>> deleteVoiceCommand(@PathVariable Long commandId) {
        try {
            Long userId = getCurrentUserId();
            voiceCommandService.deleteVoiceCommand(commandId, userId);
            return ResponseEntity.ok(ApiResponse.success("Command deleted"));
        } catch (org.springframework.security.access.AccessDeniedException ade) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Not authorized to delete this command"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Error deleting command: " + e.getMessage()));
        }
    }
}
