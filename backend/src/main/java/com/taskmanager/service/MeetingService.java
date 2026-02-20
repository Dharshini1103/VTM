package com.taskmanager.service;

import com.taskmanager.dto.MeetingDTO;
import com.taskmanager.dto.request.MeetingRequest;
import com.taskmanager.entity.Meeting;
import com.taskmanager.entity.User;
import com.taskmanager.repository.MeetingRepository;
import com.taskmanager.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class MeetingService {

    private static final Logger logger = LoggerFactory.getLogger(MeetingService.class);

    @Autowired
    private MeetingRepository meetingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ZoomMeetingService zoomMeetingService;

    public List<MeetingDTO> getAllMeetings() {
        List<Meeting> meetings = meetingRepository.findAll();
        return meetings.stream()
                .map(MeetingDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<MeetingDTO> getAllMeetingsWithParticipantInfo(Long currentUserId) {
        List<Meeting> meetings = meetingRepository.findAll();
        return meetings.stream()
                .map(meeting -> {
                    MeetingDTO dto = MeetingDTO.fromEntity(meeting);
                    // Check if current user is a participant (creator or attendee)
                    boolean isParticipant = meeting.getCreatedBy().getId().equals(currentUserId) ||
                            (meeting.getAttendees() != null && 
                             meeting.getAttendees().stream().anyMatch(attendee -> attendee.getId().equals(currentUserId)));
                    dto.setCanJoin(isParticipant);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public boolean canUserJoinMeeting(Long meetingId, Long userId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
        
        // User can join if they are the creator or an attendee
        boolean isCreator = meeting.getCreatedBy().getId().equals(userId);
        boolean isAttendee = meeting.getAttendees() != null && 
                             meeting.getAttendees().stream().anyMatch(attendee -> attendee.getId().equals(userId));
        
        return isCreator || isAttendee;
    }

    public List<MeetingDTO> getMeetingsForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get meetings where user is either creator or attendee
        List<Meeting> createdMeetings = meetingRepository.findByCreatedBy(user);
        List<Meeting> attendedMeetings = meetingRepository.findByAttendeesContaining(user);
        
        // Combine both lists and remove duplicates
        List<Meeting> allMeetings = new ArrayList<>();
        allMeetings.addAll(createdMeetings);
        allMeetings.addAll(attendedMeetings);
        
        // Remove duplicates based on meeting ID
        return allMeetings.stream()
                .distinct()
                .map(MeetingDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public MeetingDTO scheduleMeeting(MeetingRequest request, Long createdByUserId) {
        logger.info("Scheduling meeting: {} by user: {}", request.getTitle(), createdByUserId);

        // Validate date times
        if (request.getEndDateTime().isBefore(request.getStartDateTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        User createdBy = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Meeting meeting = new Meeting();
        meeting.setTitle(request.getTitle());
        meeting.setDescription(request.getDescription());
        meeting.setMeetingType(request.getMeetingType());
        meeting.setStartDateTime(request.getStartDateTime());
        meeting.setEndDateTime(request.getEndDateTime());
        meeting.setStatus(Meeting.MeetingStatus.SCHEDULED);
        meeting.setCreatedBy(createdBy);
        
        // Set meetLink if provided
        String meetLink = request.getMeetLink();
        logger.info("Setting meetLink for meeting: {} - Link: {}", request.getTitle(), meetLink);
        meeting.setMeetLink(meetLink);

        // Add attendees if provided
        if (request.getAttendeeIds() != null && !request.getAttendeeIds().isEmpty()) {
            try {
                List<User> attendees = userRepository.findAllById(request.getAttendeeIds());
                meeting.setAttendees(attendees);
            } catch (Exception e) {
                logger.warn("Failed to load attendees for meeting: {}", e.getMessage());
                meeting.setAttendees(new ArrayList<>());
            }
        } else {
            meeting.setAttendees(new ArrayList<>());
        }

        Meeting savedMeeting = meetingRepository.save(meeting);
        logger.info("Meeting scheduled successfully with ID: {}", savedMeeting.getId());

        return MeetingDTO.fromEntity(savedMeeting);
    }

    public MeetingDTO scheduleZoomMeet(MeetingRequest request, Long createdByUserId) {
        logger.info("Scheduling Zoom meeting: {} by user: {}", request.getTitle(), createdByUserId);

        // First create the meeting
        MeetingDTO meeting = scheduleMeeting(request, createdByUserId);

        try {
            // Sync with Zoom and get meet link
            String meetLink = zoomMeetingService.createZoomMeetingEvent(meeting);
            
            // Update meeting with Zoom link
            Meeting meetingEntity = meetingRepository.findById(meeting.getId())
                    .orElseThrow(() -> new RuntimeException("Meeting not found after creation"));
            meetingEntity.setMeetLink(meetLink);
            meetingEntity = meetingRepository.save(meetingEntity);

            logger.info("Zoom meeting link generated: {}", meetLink);
            return MeetingDTO.fromEntity(meetingEntity);
        } catch (Exception e) {
            logger.error("Failed to generate Zoom meeting link", e);
            throw new RuntimeException("Failed to generate Zoom meeting link: " + e.getMessage());
        }
    }

    public MeetingDTO scheduleGoogleMeet(MeetingRequest request, Long createdByUserId) {
        logger.info("Scheduling Google Meet: {} by user: {}", request.getTitle(), createdByUserId);

        // First create the meeting
        MeetingDTO meeting = scheduleMeeting(request, createdByUserId);

        try {
            // Sync with Google Calendar and get meet link
            String meetLink = zoomMeetingService.createZoomMeetingEvent(meeting);
            
            // Update meeting with Google Meet link
            Meeting meetingEntity = meetingRepository.findById(meeting.getId())
                    .orElseThrow(() -> new RuntimeException("Meeting not found after creation"));
            meetingEntity.setMeetLink(meetLink);
            meetingEntity = meetingRepository.save(meetingEntity);

            logger.info("Google Meet link generated: {}", meetLink);
            return MeetingDTO.fromEntity(meetingEntity);
        } catch (Exception e) {
            logger.error("Failed to create Google Meet event", e);
            throw new RuntimeException("Failed to create Google Meet event: " + e.getMessage());
        }
    }

    public MeetingDTO updateMeeting(Long meetingId, MeetingRequest request, Long updatedByUserId) {
        logger.info("Updating meeting: {} by user: {}", meetingId, updatedByUserId);

        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        // Validate date times
        if (request.getEndDateTime().isBefore(request.getStartDateTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        meeting.setTitle(request.getTitle());
        meeting.setDescription(request.getDescription());
        meeting.setMeetingType(request.getMeetingType());
        meeting.setStartDateTime(request.getStartDateTime());
        meeting.setEndDateTime(request.getEndDateTime());

        // Update attendees if provided
        if (request.getAttendeeIds() != null && !request.getAttendeeIds().isEmpty()) {
            List<User> attendees = userRepository.findAllById(request.getAttendeeIds());
            meeting.setAttendees(attendees);
        }

        Meeting updatedMeeting = meetingRepository.save(meeting);
        logger.info("Meeting updated successfully: {}", updatedMeeting.getId());

        return MeetingDTO.fromEntity(updatedMeeting);
    }

    public void deleteMeeting(Long meetingId, Long deletedByUserId) {
        logger.info("Deleting meeting: {} by user: {}", meetingId, deletedByUserId);

        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        // Delete from Google Calendar if synced
        if (meeting.getGoogleCalendarEventId() != null) {
            try {
                zoomMeetingService.deleteCalendarEvent(meeting.getGoogleCalendarEventId());
            } catch (Exception e) {
                logger.warn("Failed to delete event from Google Calendar: {}", e.getMessage());
            }
        }

        meetingRepository.delete(meeting);
        logger.info("Meeting deleted successfully: {}", meetingId);
    }

    public MeetingDTO syncWithGoogleCalendar(Long meetingId, Long syncedByUserId) {
        logger.info("Syncing meeting with Google Calendar: {} by user: {}", meetingId, syncedByUserId);

        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        try {
            if (meeting.getGoogleCalendarEventId() == null) {
                // Create new event in Google Calendar
                String eventId = zoomMeetingService.createCalendarEvent(meeting);
                meeting.setGoogleCalendarEventId(eventId);
            } else {
                // Update existing event
                zoomMeetingService.updateCalendarEvent(meeting.getGoogleCalendarEventId(), meeting);
            }

            Meeting updatedMeeting = meetingRepository.save(meeting);
            logger.info("Meeting synced with Google Calendar successfully: {}", updatedMeeting.getId());

            return MeetingDTO.fromEntity(updatedMeeting);
        } catch (Exception e) {
            logger.error("Failed to sync meeting with Google Calendar", e);
            throw new RuntimeException("Failed to sync with Google Calendar: " + e.getMessage());
        }
    }

    public List<MeetingDTO> getUpcomingMeetings() {
        List<Meeting> meetings = meetingRepository.findUpcomingMeetings(LocalDateTime.now());
        return meetings.stream()
                .map(MeetingDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<MeetingDTO> getTodayMeetings() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1).minusSeconds(1);
        
        List<Meeting> meetings = meetingRepository.findMeetingsOnDate(startOfDay, endOfDay);
        return meetings.stream()
                .map(MeetingDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
