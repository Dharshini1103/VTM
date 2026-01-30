package com.taskmanager.service;

import com.taskmanager.dto.TaskDTO;
import com.taskmanager.dto.request.CreateTaskRequest;
import com.taskmanager.dto.request.UpdateTaskRequest;
import com.taskmanager.entity.Task;
import com.taskmanager.entity.User;
import com.taskmanager.exception.ResourceNotFoundException;
import com.taskmanager.exception.BadRequestException;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@SuppressWarnings("null")
public class TaskService {

    private static final Logger logger = LoggerFactory.getLogger(TaskService.class);

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public TaskDTO createTask(Long createdById, CreateTaskRequest request) {
        logger.info("Creating new task for user: {}", createdById);

        User creator = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("Creator user not found"));

        User assignee = userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));

        if (request.getDeadline().isBefore(LocalDate.now())) {
            throw new BadRequestException("Deadline must be in the future");
        }

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setStatus(request.getStatus() != null ? request.getStatus() : Task.TaskStatus.PENDING);
        task.setDeadline(request.getDeadline());
        task.setCreatedBy(creator);
        task.setAssignedTo(assignee);
        task.setCallScheduled(false);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());

        Task savedTask = taskRepository.save(task);
        logger.info("Task created successfully with ID: {}", savedTask.getId());

        return TaskDTO.fromEntity(savedTask);
    }

    public TaskDTO getTaskById(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));
        return TaskDTO.fromEntity(task);
    }

    public List<TaskDTO> getUserTasks(Long userId) {
        return taskRepository.findTasksByUserId(userId).stream()
                .map(TaskDTO::fromEntity)
                .toList();
    }

    public List<TaskDTO> getTasksCreatedByUser(Long userId) {
        return taskRepository.findByCreatedById(userId).stream()
                .map(TaskDTO::fromEntity)
                .toList();
    }

    public List<TaskDTO> getAssignedTasks(Long userId) {
        return taskRepository.findByAssignedToId(userId).stream()
                .map(TaskDTO::fromEntity)
                .toList();
    }

    public List<TaskDTO> getActiveTasksForUser(Long userId) {
        return taskRepository.findActiveTasksForUser(userId).stream()
                .map(TaskDTO::fromEntity)
                .toList();
    }

    public List<TaskDTO> getTasksByStatus(Task.TaskStatus status) {
        return taskRepository.findByStatus(status).stream()
                .map(TaskDTO::fromEntity)
                .toList();
    }

    public List<TaskDTO> getTasksByPriority(Task.TaskPriority priority) {
        return taskRepository.findByPriority(priority).stream()
                .map(TaskDTO::fromEntity)
                .toList();
    }

    public List<TaskDTO> getOverdueTasks() {
        return taskRepository.findOverdueTasks(LocalDateTime.now()).stream()
                .map(TaskDTO::fromEntity)
                .toList();
    }

    public List<TaskDTO> getUpcomingTasks() {
        return taskRepository.findUpcomingTasks().stream()
                .map(TaskDTO::fromEntity)
                .toList();
    }

    public TaskDTO updateTask(Long taskId, UpdateTaskRequest request) {
        logger.info("Updating task with ID: {}", taskId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            task.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }

        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }

        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }

        if (request.getDeadline() != null) {
            if (request.getDeadline().isBefore(LocalDate.now())) {
                throw new BadRequestException("Deadline must be in the future");
            }
            task.setDeadline(request.getDeadline());
        }

        if (request.getAssignedToId() != null) {
            User assignee = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
            task.setAssignedTo(assignee);
        }

        task.setUpdatedAt(LocalDateTime.now());
        Task updatedTask = taskRepository.save(task);

        logger.info("Task updated successfully: {}", taskId);
        return TaskDTO.fromEntity(updatedTask);
    }

    public TaskDTO markTaskAsCompleted(Long taskId) {
        logger.info("Marking task as completed: {}", taskId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        task.setStatus(Task.TaskStatus.COMPLETED);
        task.setUpdatedAt(LocalDateTime.now());

        Task updatedTask = taskRepository.save(task);
        return TaskDTO.fromEntity(updatedTask);
    }

    public TaskDTO assignTaskToUser(Long taskId, Long userId) {
        logger.info("Assigning task {} to user {}", taskId, userId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        task.setAssignedTo(user);
        task.setUpdatedAt(LocalDateTime.now());

        Task updatedTask = taskRepository.save(task);
        logger.info("Task assigned successfully");

        return TaskDTO.fromEntity(updatedTask);
    }

    public void deleteTask(Long taskId) {
        logger.info("Deleting task with ID: {}", taskId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        taskRepository.delete(task);
        logger.info("Task deleted successfully: {}", taskId);
    }
}
