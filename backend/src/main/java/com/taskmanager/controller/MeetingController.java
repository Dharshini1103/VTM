package com.taskmanager.controller;

import com.taskmanager.dto.MeetingDTO;
import com.taskmanager.dto.request.MeetingRequest;
import com.taskmanager.dto.response.ApiResponse;
import com.taskmanager.service.MeetingService;
import com.taskmanager.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/meetings")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class MeetingController {

    private final MeetingService meetingService;
    private final UserService userService;

    public MeetingController(MeetingService meetingService, UserService userService) {
        this.meetingService = meetingService;
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MeetingDTO>>> getAllMeetings() {
        Long currentUserId = getCurrentUserId();
        List<MeetingDTO> meetings = meetingService.getAllMeetingsWithParticipantInfo(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Meetings retrieved successfully", meetings));
    }

    @GetMapping("/my-meetings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MeetingDTO>>> getMyMeetings() {
        Long currentUserId = getCurrentUserId();
        List<MeetingDTO> meetings = meetingService.getMeetingsForUser(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("User meetings retrieved successfully", meetings));
    }

    @GetMapping("/{meetingId}/can-join")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Boolean>> canJoinMeeting(@PathVariable Long meetingId) {
        Long currentUserId = getCurrentUserId();
        boolean canJoin = meetingService.canUserJoinMeeting(meetingId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Join permission checked", canJoin));
    }

    @PostMapping("/schedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<MeetingDTO>> scheduleMeeting(@Valid @RequestBody MeetingRequest request) {
        Long currentUserId = getCurrentUserId();
        MeetingDTO meeting = meetingService.scheduleMeeting(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Meeting scheduled successfully", meeting));
    }

    @PostMapping("/schedule-zoom")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<MeetingDTO>> scheduleZoomMeet(@Valid @RequestBody MeetingRequest request) {
        Long currentUserId = getCurrentUserId();
        MeetingDTO meeting = meetingService.scheduleZoomMeet(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Zoom meeting scheduled successfully", meeting));
    }

    @PutMapping("/{meetingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<MeetingDTO>> updateMeeting(
            @PathVariable Long meetingId,
            @Valid @RequestBody MeetingRequest request) {
        Long currentUserId = getCurrentUserId();
        MeetingDTO meeting = meetingService.updateMeeting(meetingId, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Meeting updated successfully", meeting));
    }

    @DeleteMapping("/{meetingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteMeeting(@PathVariable Long meetingId) {
        Long currentUserId = getCurrentUserId();
        meetingService.deleteMeeting(meetingId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Meeting deleted successfully", null));
    }

    @PostMapping("/{meetingId}/sync-calendar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MeetingDTO>> syncWithGoogleCalendar(@PathVariable Long meetingId) {
        Long currentUserId = getCurrentUserId();
        MeetingDTO meeting = meetingService.syncWithGoogleCalendar(meetingId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Meeting synced with Google Calendar successfully", meeting));
    }

    @GetMapping("/upcoming")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MeetingDTO>>> getUpcomingMeetings() {
        List<MeetingDTO> meetings = meetingService.getUpcomingMeetings();
        return ResponseEntity.ok(ApiResponse.success("Upcoming meetings retrieved successfully", meetings));
    }

    @GetMapping("/today")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MeetingDTO>>> getTodayMeetings() {
        List<MeetingDTO> meetings = meetingService.getTodayMeetings();
        return ResponseEntity.ok(ApiResponse.success("Today's meetings retrieved successfully", meetings));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getName() != null) {
            String email = authentication.getName();
            com.taskmanager.dto.UserDTO userDTO = userService.getUserByEmail(email);
            return userDTO.getId();
        }
        throw new RuntimeException("Unable to determine current user");
    }
}
