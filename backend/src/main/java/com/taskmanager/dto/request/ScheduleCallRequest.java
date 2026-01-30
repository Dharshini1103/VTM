package com.taskmanager.dto.request;



import com.taskmanager.entity.Task;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;



public class ScheduleCallRequest {

    

    @NotNull(message = "Task ID is required")

    @Positive(message = "Task ID must be positive")

    private Long taskId;

    

    @NotNull(message = "Call type is required")

    private Task.CallType callType;

    

    @NotNull(message = "Scheduled date and time is required")

    @FutureOrPresent(message = "Scheduled time must be in the future")

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")

    private LocalDateTime scheduledDateTime;

    

    private String description;

}

