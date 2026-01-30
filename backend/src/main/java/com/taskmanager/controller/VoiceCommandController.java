package com.taskmanager.controller;

import com.taskmanager.dto.VoiceCommandDTO;
import com.taskmanager.dto.request.VoiceInputRequest;
import com.taskmanager.dto.response.ApiResponse;
import com.taskmanager.service.VoiceCommandService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/voice")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class VoiceCommandController {

    private final VoiceCommandService voiceCommandService;

    public VoiceCommandController(VoiceCommandService voiceCommandService) {
        this.voiceCommandService = voiceCommandService;
    }

    private Long getCurrentUserId() {
        // Extract user ID from JWT token
        return 3L; // This will be set properly through security context - using existing user ID 3
    }

    @PostMapping("/process")
    public ResponseEntity<ApiResponse<VoiceCommandDTO>> processVoiceCommand(@Valid @RequestBody VoiceInputRequest request) {
        Long userId = getCurrentUserId();
        VoiceCommandDTO command = voiceCommandService.processVoiceCommand(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Voice command processed", command));
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
