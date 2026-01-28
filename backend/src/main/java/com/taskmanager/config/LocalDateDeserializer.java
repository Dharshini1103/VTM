package com.taskmanager.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class LocalDateDeserializer extends JsonDeserializer<LocalDate> {

    @Override
    public LocalDate deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String dateString = p.getValueAsString();
        
        if (dateString == null) {
            return null;
        }

        try {
            // Try parsing as ISO 8601 with timezone (e.g., "2026-02-13T03:00:01.000Z")
            if (dateString.contains("T")) {
                ZonedDateTime zdt = ZonedDateTime.parse(dateString);
                return zdt.toLocalDate();
            }
            
            // Parse as date only (e.g., "2026-02-13")
            return LocalDate.parse(dateString, DateTimeFormatter.ISO_DATE);
        } catch (Exception e) {
            throw new IOException("Unable to deserialize LocalDate: " + dateString, e);
        }
    }
}
