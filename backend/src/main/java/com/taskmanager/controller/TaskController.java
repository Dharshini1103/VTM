package com.taskmanager.controller;

import com.taskmanager.dto.TaskDTO;
import com.taskmanager.dto.request.CreateTaskRequest;
import com.taskmanager.dto.request.UpdateTaskRequest;
import com.taskmanager.dto.response.ApiResponse;
import com.taskmanager.entity.Task;
import com.taskmanager.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    private Long getCurrentUserId() {
        // Extract user ID from JWT token (would be passed through filter)
        return 1L; // This will be set properly through security context
    }

    @PostMapping
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
        TaskDTO task = taskService.updateTask(taskId, request);
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", task));
    }

    @PatchMapping("/{taskId}/complete")
    public ResponseEntity<ApiResponse<TaskDTO>> completeTask(@PathVariable Long taskId) {
        TaskDTO task = taskService.markTaskAsCompleted(taskId);
        return ResponseEntity.ok(ApiResponse.success("Task marked as completed", task));
    }

    @PatchMapping("/{taskId}/assign/{userId}")
    public ResponseEntity<ApiResponse<TaskDTO>> assignTask(@PathVariable Long taskId, @PathVariable Long userId) {
        TaskDTO task = taskService.assignTaskToUser(taskId, userId);
        return ResponseEntity.ok(ApiResponse.success("Task assigned successfully", task));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully"));
    }
}
