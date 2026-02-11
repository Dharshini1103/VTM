package com.taskmanager.dto;

import com.taskmanager.entity.Meeting;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class MeetingDTO {
    private Long id;
    private String title;
    private String description;
    private Meeting.MeetingType meetingType;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private Meeting.MeetingStatus status;
    private List<UserDTO> attendees = new ArrayList<>(); // Initialize to prevent NPE
    private String googleCalendarEventId;
    private String meetLink;
    private UserDTO createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean canJoin; // Field to indicate if current user can join this meeting

    // Default constructor
    public MeetingDTO() {
        this.attendees = new ArrayList<>(); // Ensure always initialized
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Meeting.MeetingType getMeetingType() { return meetingType; }
    public void setMeetingType(Meeting.MeetingType meetingType) { this.meetingType = meetingType; }
    
    public LocalDateTime getStartDateTime() { return startDateTime; }
    public void setStartDateTime(LocalDateTime startDateTime) { this.startDateTime = startDateTime; }
    
    public LocalDateTime getEndDateTime() { return endDateTime; }
    public void setEndDateTime(LocalDateTime endDateTime) { this.endDateTime = endDateTime; }
    
    public Meeting.MeetingStatus getStatus() { return status; }
    public void setStatus(Meeting.MeetingStatus status) { this.status = status; }
    
    public List<UserDTO> getAttendees() { 
        // Defensive programming: never return null
        return attendees != null ? attendees : new ArrayList<>(); 
    }
    
    public void setAttendees(List<UserDTO> attendees) { 
        // Defensive programming: never allow null
        this.attendees = attendees != null ? attendees : new ArrayList<>(); 
    }
    
    public String getGoogleCalendarEventId() { return googleCalendarEventId; }
    public void setGoogleCalendarEventId(String googleCalendarEventId) { this.googleCalendarEventId = googleCalendarEventId; }
    
    public String getMeetLink() { return meetLink; }
    public void setMeetLink(String meetLink) { this.meetLink = meetLink; }
    
    public UserDTO getCreatedBy() { return createdBy; }
    public void setCreatedBy(UserDTO createdBy) { this.createdBy = createdBy; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getCanJoin() { return canJoin; }
    public void setCanJoin(Boolean canJoin) { this.canJoin = canJoin; }

    public static MeetingDTO fromEntity(Meeting meeting) {
        if (meeting == null) {
            return null;
        }

        MeetingDTO dto = new MeetingDTO();
        dto.setId(meeting.getId());
        dto.setTitle(meeting.getTitle());
        dto.setDescription(meeting.getDescription());
        dto.setMeetingType(meeting.getMeetingType());
        dto.setStartDateTime(meeting.getStartDateTime());
        dto.setEndDateTime(meeting.getEndDateTime());
        dto.setStatus(meeting.getStatus());
        dto.setAttendees(meeting.getAttendees() != null ? 
            meeting.getAttendees().stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList()) : new ArrayList<>());
        dto.setGoogleCalendarEventId(meeting.getGoogleCalendarEventId());
        dto.setMeetLink(meeting.getMeetLink());
        
        // Debug logging for meetLink
        System.out.println("=== MEETING DTO DEBUG ===");
        System.out.println("Meeting ID: " + meeting.getId());
        System.out.println("Meeting Title: " + meeting.getTitle());
        System.out.println("MeetLink: " + meeting.getMeetLink());
        System.out.println("DTO MeetLink: " + dto.getMeetLink());
        System.out.println("========================");
        dto.setCreatedBy(meeting.getCreatedBy() != null ? UserDTO.fromEntity(meeting.getCreatedBy()) : null);
        dto.setCreatedAt(meeting.getCreatedAt());
        dto.setUpdatedAt(meeting.getUpdatedAt());
        
        return dto;
    }
}
