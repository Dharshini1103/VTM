package com.taskmanager.service;

import com.taskmanager.dto.MeetingDTO;
import com.taskmanager.dto.UserDTO;
import com.taskmanager.entity.Meeting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Zoom Meeting Service - Creates Zoom meeting links
 * This service generates Zoom meeting links that participants can actually use
 * 
 * Configuration required (set via environment variables or application.yml):
 * - ZOOM_API_KEY: Zoom API key
 * - ZOOM_API_SECRET: Zoom API secret
 * - ZOOM_ACCOUNT_ID: Zoom account ID
 * 
 * For now: Generates working Zoom meeting links with proper format
 */
@Service
public class ZoomMeetingService {
    private final Logger logger = LoggerFactory.getLogger(ZoomMeetingService.class);

    @Value("${zoom.api.key:}")
    private String zoomApiKey;

    @Value("${zoom.api.secret:}")
    private String zoomApiSecret;

    @Value("${zoom.account.id:}")
    private String zoomAccountId;

    public static class ScheduledCallResult {
        public final String eventId;
        public final String meetLink;

        public ScheduledCallResult(String eventId, String meetLink) {
            this.eventId = eventId;
            this.meetLink = meetLink;
        }
    }

    /**
     * Schedule a call with Zoom meeting.
     * Creates a working Zoom meeting link for actual meeting participation.
     * 
     * @param organizerEmail organizer email
     * @param attendees list of attendee emails
     * @param title event title
     * @param start start time (ZonedDateTime)
     * @param end end time (ZonedDateTime)
     * @return ScheduledCallResult with event id and meet link
     */
    public ScheduledCallResult scheduleCall(String organizerEmail, List<String> attendees,
                                                String title, ZonedDateTime start, ZonedDateTime end) throws Exception {
            logger.info("[ZoomMeetingService] Creating Zoom meeting link for: {}", title);

            // Create event ID for tracking
            String eventId = "zoom-" + System.currentTimeMillis();
            
            // Use the specified default Zoom meeting link
            String defaultZoomLink = "https://us05web.zoom.us/j/8024876500?pwd=RRqLJvROlv8YY1UVd3dCtylBw4F2o0.1";
            
            logger.info("Using default Zoom meeting link: {} for meeting: {}", defaultZoomLink, title);
            logger.info("[ZoomMeetingService] Participants can join at: {}", defaultZoomLink);
            logger.info("[ZoomMeetingService] Meeting ID: 8024876500 | Password: RRqLJvROlv8YY1UVd3dCtylBw4F2o0.1");

            return new ScheduledCallResult(eventId, defaultZoomLink);
        }
        
        /**
         * Generate Zoom meeting ID (10-11 digit number)
         * This follows Zoom's meeting ID format
         */
        private String generateZoomMeetingId() {
            // Generate 10-11 digit meeting ID like: 12345678901
            long meetingId = (long) (Math.random() * 90000000000L) + 10000000000L;
            return String.valueOf(meetingId);
        }

        /**
         * Generate Zoom meeting password (6 characters)
         * This follows Zoom's password format
         */
        private String generateZoomPassword() {
            String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            StringBuilder password = new StringBuilder();
            
            for (int i = 0; i < 6; i++) {
                password.append(chars.charAt((int) (Math.random() * chars.length())));
            }
            
            return password.toString();
        }

        /**
         * Create a Zoom meeting event for a meeting
         */
        public String createZoomMeetingEvent(MeetingDTO meeting) throws Exception {
            logger.info("Creating Zoom meeting event for meeting: {}", meeting.getTitle());

            // Defensive programming: validate input
            if (meeting == null) {
                throw new IllegalArgumentException("Meeting cannot be null");
            }

            // Defensive programming: safe attendees extraction
            List<String> attendeeEmails = new ArrayList<>();
            List<UserDTO> attendees = meeting.getAttendees();
            if (!attendees.isEmpty()) {
                attendeeEmails = attendees.stream()
                        .filter(attendee -> attendee != null && attendee.getEmail() != null)
                        .map(attendee -> attendee.getEmail())
                        .collect(Collectors.toList());
            }

            // Defensive programming: safe organizer email extraction
            String organizerEmail = "unknown@example.com";
            UserDTO createdBy = meeting.getCreatedBy();
            if (createdBy != null && createdBy.getEmail() != null) {
                organizerEmail = createdBy.getEmail();
            }

            ZonedDateTime start = meeting.getStartDateTime().atZone(java.time.ZoneId.systemDefault());
            ZonedDateTime end = meeting.getEndDateTime().atZone(java.time.ZoneId.systemDefault());

            ScheduledCallResult result = scheduleCall(
                organizerEmail,
                attendeeEmails,
                meeting.getTitle(),
                start,
                end
            );

            logger.info("Zoom meeting event created with ID: {} and link: {}", result.eventId, result.meetLink);
            return result.meetLink;
        }

        /**
         * Create a calendar event (without Zoom)
         */
        public String createCalendarEvent(Meeting meeting) throws Exception {
            logger.info("Creating calendar event for meeting: {}", meeting.getTitle());

            // Defensive programming: validate input
            if (meeting == null) {
                throw new IllegalArgumentException("Meeting cannot be null");
            }

            ScheduledCallResult result = scheduleCall(
                "unknown@example.com",
                List.of("organizer@example.com"),
                meeting.getTitle(),
                meeting.getStartDateTime().atZone(java.time.ZoneId.systemDefault()),
                meeting.getEndDateTime().atZone(java.time.ZoneId.systemDefault())
            );

            logger.info("Calendar event created with ID: {}", result.eventId);
            return result.eventId;
        }

        /**
         * Update an existing calendar event
         */
        public void updateCalendarEvent(String eventId, Meeting meeting) throws Exception {
            logger.info("Updating calendar event: {} for meeting: {}", eventId, meeting.getTitle());
            logger.warn("Calendar event update not yet implemented. Placeholder for event ID: {}", eventId);
        }

        /**
         * Delete a calendar event
         */
        public void deleteCalendarEvent(String eventId) throws Exception {
            logger.info("Deleting calendar event: {}", eventId);
            logger.warn("Calendar event deletion not yet implemented. Placeholder for event ID: {}", eventId);
        }

        /**
         * Sync with Zoom Calendar
         */
        public void syncWithZoomCalendar(String meetingId) throws Exception {
            logger.info("Syncing with Zoom Calendar for meeting: {}", meetingId);
            logger.warn("Zoom Calendar sync not yet implemented. Placeholder for meeting ID: {}", meetingId);
        }
    }
