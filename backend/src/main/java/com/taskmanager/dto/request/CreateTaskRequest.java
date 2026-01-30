package com.taskmanager.dto.request;

import com.taskmanager.entity.Task;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.taskmanager.config.LocalDateDeserializer;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class CreateTaskRequest {
    
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    private String title;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    @NotNull(message = "Priority is required")
    private Task.TaskPriority priority;

    private Task.TaskStatus status; // optional on create, defaults to TO_DO if not provided
    
    @NotNull(message = "Deadline is required")
    @FutureOrPresent(message = "Deadline must be in the future or present")
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonDeserialize(using = LocalDateDeserializer.class)
    private LocalDate deadline;
    
    @NotNull(message = "Assignee ID is required")
    @Positive(message = "Assignee ID must be positive")
    private Long assignedToId;
    
    // Getters and setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Task.TaskPriority getPriority() { return priority; }
    public void setPriority(Task.TaskPriority priority) { this.priority = priority; }
    
    public Task.TaskStatus getStatus() { return status; }
    public void setStatus(Task.TaskStatus status) { this.status = status; }
    
    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }
    
    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }
}
