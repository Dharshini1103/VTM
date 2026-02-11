package com.taskmanager.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.taskmanager.entity.Meeting;

import java.io.IOException;

public class MeetingTypeDeserializer extends JsonDeserializer<Meeting.MeetingType> {
    
    @Override
    public Meeting.MeetingType deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getValueAsString();
        
        if (value == null) return null;
        
        // Handle backward compatibility - convert GOOGLE_MEET to ZOOM_MEET
        if ("GOOGLE_MEET".equals(value)) {
            return Meeting.MeetingType.ZOOM_MEET;
        }
        
        try {
            return Meeting.MeetingType.valueOf(value);
        } catch (IllegalArgumentException e) {
            // Log the error and return a default value
            System.err.println("Unknown meeting type: " + value + ", defaulting to ZOOM_MEET");
            return Meeting.MeetingType.ZOOM_MEET;
        }
    }
}
