package com.taskmanager;

import com.taskmanager.dto.MeetingDTO;
import com.taskmanager.entity.Meeting;
import com.taskmanager.service.GoogleCalendarService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;

@SpringBootTest
public class MeetingTest {

    @Test
    public void testMeetingDTOWithNullAttendees() {
        // Create a meeting entity with null attendees
        Meeting meeting = new Meeting();
        meeting.setId(1L);
        meeting.setTitle("Test Meeting");
        meeting.setDescription("Test Description");
        meeting.setStartDateTime(LocalDateTime.now());
        meeting.setEndDateTime(LocalDateTime.now().plusHours(1));
        meeting.setAttendees(null); // This is the key test
        
        // Convert to DTO - should not throw NPE
        MeetingDTO dto = MeetingDTO.fromEntity(meeting);
        
        // Verify DTO has empty list instead of null
        assert dto.getAttendees() != null;
        assert dto.getAttendees().isEmpty();
        
        System.out.println("✅ Test passed: MeetingDTO handles null attendees correctly");
    }
    
    @Test
    public void testGoogleCalendarServiceWithNullAttendees() {
        GoogleCalendarService service = new GoogleCalendarService();
        
        // Create a meeting DTO with null attendees
        MeetingDTO meetingDTO = new MeetingDTO();
        meetingDTO.setTitle("Test Meeting");
        meetingDTO.setStartDateTime(LocalDateTime.now());
        meetingDTO.setEndDateTime(LocalDateTime.now().plusHours(1));
        meetingDTO.setAttendees(null); // This is the key test
        
        try {
            // This should not throw NPE anymore
            service.createGoogleMeetEvent(meetingDTO);
            System.out.println("✅ Test passed: GoogleCalendarService handles null attendees");
        } catch (NullPointerException e) {
            System.err.println("❌ Test failed: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            // Other exceptions are okay (like missing Google credentials)
            System.out.println("✅ Test passed: No NPE thrown for null attendees");
        }
    }
}
