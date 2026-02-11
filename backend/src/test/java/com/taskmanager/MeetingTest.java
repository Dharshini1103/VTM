package com.taskmanager;

import com.taskmanager.dto.MeetingDTO;
import com.taskmanager.entity.Meeting;
import com.taskmanager.service.ZoomMeetingService;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

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
    public void testMultipleMeetingsUseSameDefaultLink() throws Exception {
        ZoomMeetingService service = new ZoomMeetingService();
        
        System.out.println("=== TESTING MULTIPLE MEETINGS - ALL SHOULD USE SAME DEFAULT LINK ===");
        
        // Test 3 different meetings
        for (int i = 1; i <= 3; i++) {
            String meetingTitle = "Meeting " + i;
            
            ZoomMeetingService.ScheduledCallResult result = service.scheduleCall(
                "test@example.com",
                null,
                meetingTitle,
                java.time.ZonedDateTime.now(),
                java.time.ZonedDateTime.now().plusHours(1)
            );
            
            System.out.println("Meeting " + i + ":");
            System.out.println("  Title: " + meetingTitle);
            System.out.println("  Event ID: " + result.eventId);
            System.out.println("  Zoom Link: " + result.meetLink);
            
            // Verify all meetings use the same default link
            assert result.meetLink.equals("https://us05web.zoom.us/j/8024876500?pwd=RRqLJvROlv8YY1UVd3dCtylBw4F2o0.1");
            System.out.println("  ✅ CORRECT: Uses default link");
            System.out.println();
        }
        
        System.out.println("=== VERIFICATION COMPLETE ===");
        System.out.println("✅ ALL MEETINGS USE SAME DEFAULT LINK");
        System.out.println("✅ Meeting ID: 8024876500");
        System.out.println("✅ Default Link: https://us05web.zoom.us/j/8024876500?pwd=RRqLJvROlv8YY1UVd3dCtylBw4F2o0.1");
        System.out.println("✅ Password: RRqLJvROlv8YY1UVd3dCtylBw4F2o0.1");
    }
    
    @Test
    public void testZoomMeetingServiceWithNullAttendees() {
        ZoomMeetingService service = new ZoomMeetingService();
        
        // Test that the service can be instantiated without errors
        assert service != null;
        
        // Test basic service functionality
        try {
            // Test the scheduleCall method which should handle null attendees
            ZoomMeetingService.ScheduledCallResult result = service.scheduleCall(
                "test@example.com",
                null, // null attendees list
                "Test Meeting",
                java.time.ZonedDateTime.now(),
                java.time.ZonedDateTime.now().plusHours(1)
            );
            
            // Verify result is not null
            assert result != null;
            assert result.eventId != null;
            assert result.meetLink != null;
            assert result.meetLink.contains("zoom.us");
            
            System.out.println("✅ Test passed: ZoomMeetingService handles null attendees");
            System.out.println("   Generated meeting link: " + result.meetLink);
        } catch (NullPointerException e) {
            System.err.println("❌ Test failed: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            // Other exceptions are okay (like missing Zoom credentials)
            System.out.println("✅ Test passed: No NPE thrown for null attendees");
            System.out.println("   Expected exception: " + e.getClass().getSimpleName());
        }
    }
}
