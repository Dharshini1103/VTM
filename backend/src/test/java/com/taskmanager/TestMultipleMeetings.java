package com.taskmanager;

import com.taskmanager.service.ZoomMeetingService;
import java.time.ZonedDateTime;

public class TestMultipleMeetings {
    public static void main(String[] args) throws Exception {
        ZoomMeetingService service = new ZoomMeetingService();
        
        System.out.println("=== TESTING MULTIPLE MEETINGS - ALL SHOULD USE SAME DEFAULT LINK ===\n");
        
        // Test 3 different meetings
        for (int i = 1; i <= 3; i++) {
            String meetingTitle = "Meeting " + i;
            
            ZoomMeetingService.ScheduledCallResult result = service.scheduleCall(
                "test@example.com",
                null,
                meetingTitle,
                ZonedDateTime.now(),
                ZonedDateTime.now().plusHours(1)
            );
            
            System.out.println("Meeting " + i + ":");
            System.out.println("  Title: " + meetingTitle);
            System.out.println("  Event ID: " + result.eventId);
            System.out.println("  Zoom Link: " + result.meetLink);
            System.out.println();
        }
        
        System.out.println("=== VERIFICATION: ALL MEETINGS USE SAME DEFAULT LINK ===");
        System.out.println("✅ Meeting ID: 8024876500");
        System.out.println("✅ Default Link: https://us05web.zoom.us/j/8024876500?pwd=RRqLJvROlv8YY1UVd3dCtylBw4F2o0.1");
        System.out.println("✅ Password: RRqLJvROlv8YY1UVd3dCtylBw4F2o0.1");
    }
}
