package com.taskmanager.entity;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.taskmanager.deserializer.MeetingTypeDeserializer;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "meetings")
public class Meeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @JsonDeserialize(using = MeetingTypeDeserializer.class)
    @Column(nullable = false)
    private MeetingType meetingType;

    @Column(nullable = false)
    private LocalDateTime startDateTime;

    @Column(nullable = false)
    private LocalDateTime endDateTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MeetingStatus status;

    @ManyToMany
    @JoinTable(
        name = "meeting_attendees",
        joinColumns = @JoinColumn(name = "meeting_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> attendees;

    @Column(name = "google_calendar_event_id")
    private String googleCalendarEventId;

    @Column(name = "meet_link")
    private String meetLink;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum MeetingType {
        ZOOM_MEET,
        GOOGLE_MEET, // Keep for backward compatibility during transition
        VIDEO_CALL,
        PHONE_CALL,
        IN_PERSON;
        
        // Helper method to convert old values to new ones
        public static MeetingType fromString(String value) {
            if (value == null) return null;
            
            // Handle backward compatibility
            if ("GOOGLE_MEET".equals(value)) {
                return ZOOM_MEET; // Convert old Google Meet to Zoom Meet
            }
            
            try {
                return MeetingType.valueOf(value);
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
    }

    public enum MeetingStatus {
        SCHEDULED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    // Default constructor
    public Meeting() {}

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public MeetingType getMeetingType() { return meetingType; }
    public LocalDateTime getStartDateTime() { return startDateTime; }
    public LocalDateTime getEndDateTime() { return endDateTime; }
    public MeetingStatus getStatus() { return status; }
    public List<User> getAttendees() { return attendees; }
    public String getGoogleCalendarEventId() { return googleCalendarEventId; }
    public String getMeetLink() { return meetLink; }
    public User getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setMeetingType(MeetingType meetingType) { this.meetingType = meetingType; }
    public void setStartDateTime(LocalDateTime startDateTime) { this.startDateTime = startDateTime; }
    public void setEndDateTime(LocalDateTime endDateTime) { this.endDateTime = endDateTime; }
    public void setStatus(MeetingStatus status) { this.status = status; }
    public void setAttendees(List<User> attendees) { this.attendees = attendees; }
    public void setGoogleCalendarEventId(String googleCalendarEventId) { this.googleCalendarEventId = googleCalendarEventId; }
    public void setMeetLink(String meetLink) { this.meetLink = meetLink; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
