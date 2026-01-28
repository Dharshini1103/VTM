package com.taskmanager.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class LocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    @Override
    public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String dateString = p.getValueAsString();
        
        if (dateString == null) {
            return null;
        }

        try {
            // Try parsing as ISO 8601 with timezone (e.g., "2026-02-13T03:00:01.000Z")
            if (dateString.endsWith("Z") || dateString.contains("+") || dateString.contains("-") && dateString.lastIndexOf("-") > 10) {
                ZonedDateTime zdt = ZonedDateTime.parse(dateString);
                return zdt.toLocalDateTime();
            }
            
            // Try parsing with milliseconds (e.g., "2026-02-13T03:00:01.000")
            if (dateString.contains(".")) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");
                return LocalDateTime.parse(dateString, formatter);
            }
            
            // Default format (e.g., "2026-02-13T03:00:01")
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
            return LocalDateTime.parse(dateString, formatter);
        } catch (Exception e) {
            throw new IOException("Unable to deserialize LocalDateTime: " + dateString, e);
        }
    }
}
