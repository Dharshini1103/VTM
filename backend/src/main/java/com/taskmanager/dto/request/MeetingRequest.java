package com.taskmanager.dto.request;

import com.taskmanager.entity.Meeting;

import java.time.LocalDateTime;
import java.util.List;

public class MeetingRequest {
    
    private String title;
    private String description;
    private Meeting.MeetingType meetingType;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private List<Long> attendeeIds;
    private List<Long> teamIds;
    private String meetLink;

    public MeetingRequest() {}

    public MeetingRequest(String title, String description, Meeting.MeetingType meetingType, 
                     LocalDateTime startDateTime, LocalDateTime endDateTime, 
                     List<Long> attendeeIds, List<Long> teamIds, String meetLink) {
        this.title = title;
        this.description = description;
        this.meetingType = meetingType;
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
        this.attendeeIds = attendeeIds;
        this.teamIds = teamIds;
        this.meetLink = meetLink;
    }

    // Getters
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Meeting.MeetingType getMeetingType() { return meetingType; }
    public LocalDateTime getStartDateTime() { return startDateTime; }
    public LocalDateTime getEndDateTime() { return endDateTime; }
    public List<Long> getAttendeeIds() { return attendeeIds; }
    public List<Long> getTeamIds() { return teamIds; }
    public String getMeetLink() { return meetLink; }

    // Setters
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setMeetingType(Meeting.MeetingType meetingType) { this.meetingType = meetingType; }
    public void setStartDateTime(LocalDateTime startDateTime) { this.startDateTime = startDateTime; }
    public void setEndDateTime(LocalDateTime endDateTime) { this.endDateTime = endDateTime; }
    public void setAttendeeIds(List<Long> attendeeIds) { this.attendeeIds = attendeeIds; }
    public void setTeamIds(List<Long> teamIds) { this.teamIds = teamIds; }
    public void setMeetLink(String meetLink) { this.meetLink = meetLink; }
}
