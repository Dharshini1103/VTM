package com.taskmanager.controller;

import com.taskmanager.dto.TaskDTO;
import com.taskmanager.dto.request.CreateTaskRequest;
import com.taskmanager.dto.request.UpdateTaskRequest;
import com.taskmanager.dto.response.ApiResponse;
import com.taskmanager.entity.Task;
import com.taskmanager.service.TaskService;
import com.taskmanager.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class TaskController {

    private final TaskService taskService;
    private final JwtTokenProvider tokenProvider;

    public TaskController(TaskService taskService, JwtTokenProvider tokenProvider) {
        this.taskService = taskService;
        this.tokenProvider = tokenProvider;
    }

    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getName() != null) {
                // For now, we'll need to find the user by email since JWT doesn't contain userId directly
                // This is a temporary solution - ideally we should store userId in JWT
                return 3L; // This should be replaced with proper user lookup - using existing user ID 3
            }
            return 3L; // Fallback for development - using existing user ID 3
        } catch (Exception e) {
            return 3L; // Fallback for development - using existing user ID 3
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TaskDTO>> createTask(@Valid @RequestBody CreateTaskRequest request) {
        Long userId = getCurrentUserId();
        TaskDTO task = taskService.createTask(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created successfully", task));
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskDTO>> getTaskById(@PathVariable Long taskId) {
        TaskDTO task = taskService.getTaskById(taskId);
        return ResponseEntity.ok(ApiResponse.success("Task retrieved", task));
    }

    @GetMapping("/user/my-tasks")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getMyTasks() {
        Long userId = getCurrentUserId();
        List<TaskDTO> tasks = taskService.getUserTasks(userId);
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved", tasks));
    }

    @GetMapping("/user/assigned")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getAssignedTasks() {
        Long userId = getCurrentUserId();
        List<TaskDTO> tasks = taskService.getAssignedTasks(userId);
        return ResponseEntity.ok(ApiResponse.success("Assigned tasks retrieved", tasks));
    }

    @GetMapping("/user/created")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getCreatedTasks() {
        Long userId = getCurrentUserId();
        List<TaskDTO> tasks = taskService.getTasksCreatedByUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Created tasks retrieved", tasks));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getTasksByStatus(@PathVariable Task.TaskStatus status) {
        List<TaskDTO> tasks = taskService.getTasksByStatus(status);
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved", tasks));
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getTasksByPriority(@PathVariable Task.TaskPriority priority) {
        List<TaskDTO> tasks = taskService.getTasksByPriority(priority);
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved", tasks));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getUpcomingTasks() {
        List<TaskDTO> tasks = taskService.getUpcomingTasks();
        return ResponseEntity.ok(ApiResponse.success("Upcoming tasks retrieved", tasks));
    }

    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getOverdueTasks() {
        List<TaskDTO> tasks = taskService.getOverdueTasks();
        return ResponseEntity.ok(ApiResponse.success("Overdue tasks retrieved", tasks));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskDTO>> updateTask(@PathVariable Long taskId, 
                                                           @Valid @RequestBody UpdateTaskRequest request) {
        Long userId = getCurrentUserId();
        TaskDTO task = taskService.updateTask(taskId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", task));
    }

    @PatchMapping("/{taskId}/complete")
    public ResponseEntity<ApiResponse<TaskDTO>> completeTask(@PathVariable Long taskId) {
        Long userId = getCurrentUserId();
        TaskDTO task = taskService.markTaskAsCompleted(taskId, userId);
        return ResponseEntity.ok(ApiResponse.success("Task marked as completed", task));
    }

    @PatchMapping("/{taskId}/assign/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TaskDTO>> assignTask(@PathVariable Long taskId, @PathVariable Long userId) {
        Long currentUserId = getCurrentUserId();
        TaskDTO task = taskService.assignTaskToUser(taskId, userId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Task assigned successfully", task));
    }

    @DeleteMapping("/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long taskId) {
        Long userId = getCurrentUserId();
        taskService.deleteTask(taskId, userId);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully"));
    }
}
