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
import com.taskmanager.service.VoiceCommandService.TaskDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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

    public TaskDTO updateTask(Long taskId, UpdateTaskRequest request, Long currentUserId) {
        logger.info("Updating task with ID: {} by user: {}", taskId, currentUserId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));
        
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
        
        // Check permissions: SUPER_ADMIN can update any task, ADMIN can update any task, MANAGER can update team tasks, USER can only update their own assigned tasks
        if (!currentUser.getRole().equals(User.UserRole.SUPER_ADMIN) && !currentUser.getRole().equals(User.UserRole.ADMIN)) {
            if (currentUser.getRole().equals(User.UserRole.MANAGER)) {
                // Manager can only update tasks they created or assigned to their team
                if (task.getCreatedBy() == null || !task.getCreatedBy().getId().equals(currentUserId)) {
                    throw new BadRequestException("Manager can only update tasks they created");
                }
            } else {
                // User can only update their own assigned tasks
                if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(currentUserId)) {
                    throw new BadRequestException("User can only update their own assigned tasks");
                }
            }
        }

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
            
            // Validate assignment permissions
            validateTaskAssignment(currentUser, assignee);
            
            task.setAssignedTo(assignee);
        }

        task.setUpdatedAt(LocalDateTime.now());
        Task updatedTask = taskRepository.save(task);

        logger.info("Task updated successfully: {}", taskId);
        return TaskDTO.fromEntity(updatedTask);
    }

    public TaskDTO markTaskAsCompleted(Long taskId, Long currentUserId) {
        logger.info("Marking task as completed: {} by user: {}", taskId, currentUserId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));
        
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
        
        // Check permissions: SUPER_ADMIN and ADMIN can complete any task, USER can only complete their own assigned tasks
        if (!currentUser.getRole().equals(User.UserRole.SUPER_ADMIN) && !currentUser.getRole().equals(User.UserRole.ADMIN)) {
            if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(currentUserId)) {
                throw new BadRequestException("User can only complete their own assigned tasks");
            }
        }

        task.setStatus(Task.TaskStatus.COMPLETED);
        task.setUpdatedAt(LocalDateTime.now());

        Task updatedTask = taskRepository.save(task);
        return TaskDTO.fromEntity(updatedTask);
    }

    public TaskDTO assignTaskToUser(Long taskId, Long userId, Long currentUserId) {
        logger.info("Assigning task {} to user {} by user: {}", taskId, userId, currentUserId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));
        
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
        
        // Only SUPER_ADMIN, ADMIN, and MANAGER can assign tasks
        if (!currentUser.getRole().equals(User.UserRole.SUPER_ADMIN) && 
            !currentUser.getRole().equals(User.UserRole.ADMIN) && 
            !currentUser.getRole().equals(User.UserRole.MANAGER)) {
            throw new BadRequestException("Only SUPER_ADMIN, ADMIN, and MANAGER can assign tasks");
        }
        
        // Manager can only assign tasks they created
        if (currentUser.getRole().equals(User.UserRole.MANAGER)) {
            if (task.getCreatedBy() == null || !task.getCreatedBy().getId().equals(currentUserId)) {
                throw new BadRequestException("Manager can only assign tasks they created");
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        
        // Validate assignment permissions
        validateTaskAssignment(currentUser, user);

        task.setAssignedTo(user);
        task.setUpdatedAt(LocalDateTime.now());

        Task updatedTask = taskRepository.save(task);
        logger.info("Task assigned successfully");

        return TaskDTO.fromEntity(updatedTask);
    }

    private void validateTaskAssignment(User assigner, User assignee) {
        // SUPER_ADMIN can assign to anyone
        if (assigner.getRole().equals(User.UserRole.SUPER_ADMIN)) {
            return;
        }
        
        // ADMIN can assign to MANAGER and USER, but not ADMIN or SUPER_ADMIN
        if (assigner.getRole().equals(User.UserRole.ADMIN)) {
            if (assignee.getRole().equals(User.UserRole.ADMIN) || assignee.getRole().equals(User.UserRole.SUPER_ADMIN)) {
                throw new BadRequestException("ADMIN cannot assign tasks to ADMIN or SUPER_ADMIN");
            }
            return;
        }
        
        // MANAGER can only assign to USER
        if (assigner.getRole().equals(User.UserRole.MANAGER)) {
            if (!assignee.getRole().equals(User.UserRole.USER)) {
                throw new BadRequestException("MANAGER can only assign tasks to USER");
            }
            return;
        }
    }

    public void deleteTask(Long taskId, Long currentUserId) {
        logger.info("Deleting task with ID: {} by user: {}", taskId, currentUserId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));
        
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
        
        // Check permissions: SUPER_ADMIN can delete any task, ADMIN can delete any task, MANAGER can only delete tasks they created
        if (!currentUser.getRole().equals(User.UserRole.SUPER_ADMIN) && !currentUser.getRole().equals(User.UserRole.ADMIN)) {
            if (currentUser.getRole().equals(User.UserRole.MANAGER)) {
                if (task.getCreatedBy() == null || !task.getCreatedBy().getId().equals(currentUserId)) {
                    throw new BadRequestException("Manager can only delete tasks they created");
                }
            } else {
                throw new BadRequestException("Users cannot delete tasks");
            }
        }

        taskRepository.delete(task);
        logger.info("Task deleted successfully: {}", taskId);
    }

    // Team-based task methods
    public List<TaskDTO> getTeamTasks(Long managerId) {
        List<User> teamMembers = userRepository.findTeamMembers(managerId);
        List<Task> teamTasks = new ArrayList<>();
        
        for (User member : teamMembers) {
            teamTasks.addAll(taskRepository.findByAssignedToId(member.getId()));
        }
        
        return teamTasks.stream()
                .map(TaskDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<TaskDTO> getTasksByDepartment(String department) {
        List<User> departmentUsers = userRepository.findActiveUsersByDepartment(department);
        List<Task> departmentTasks = new ArrayList<>();
        
        for (User user : departmentUsers) {
            departmentTasks.addAll(taskRepository.findByAssignedToId(user.getId()));
        }
        
        return departmentTasks.stream()
                .map(TaskDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Create task from voice command
    public TaskDTO createTaskFromVoice(Long userId, TaskDetails taskDetails) {
        logger.info("Creating task from voice command for user: {}", userId);
        
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Task task = new Task();
        task.setTitle(taskDetails.getTitle() != null ? taskDetails.getTitle() : "Voice Task");
        task.setDescription(taskDetails.getDescription() != null ? taskDetails.getDescription() : "Created from voice command");
        
        // Convert string priority to enum
        String priorityStr = taskDetails.getPriority() != null ? taskDetails.getPriority() : "MEDIUM";
        Task.TaskPriority priority;
        switch (priorityStr.toUpperCase()) {
            case "HIGH":
            case "URGENT":
                priority = Task.TaskPriority.HIGH;
                break;
            case "LOW":
                priority = Task.TaskPriority.LOW;
                break;
            default:
                priority = Task.TaskPriority.MEDIUM;
        }
        task.setPriority(priority);
        
        // Convert string status to enum
        String statusStr = taskDetails.getStatus() != null ? taskDetails.getStatus() : "TODO";
        Task.TaskStatus status;
        switch (statusStr.toUpperCase()) {
            case "IN_PROGRESS":
            case "PROGRESS":
                status = Task.TaskStatus.IN_PROGRESS;
                break;
            case "COMPLETED":
            case "DONE":
                status = Task.TaskStatus.COMPLETED;
                break;
            default:
                status = Task.TaskStatus.PENDING;
        }
        task.setStatus(status);
        
        task.setCreatedBy(currentUser);
        
        // Handle assignment
        if (taskDetails.getAssignedTo() != null && !taskDetails.getAssignedTo().isEmpty()) {
            // Try to find user by email
            User assignedUser = userRepository.findByEmail(taskDetails.getAssignedTo()).orElse(null);
            if (assignedUser == null) {
                // Try to find by gmailId
                assignedUser = userRepository.findByGmailId(taskDetails.getAssignedTo()).orElse(null);
            }
            
            if (assignedUser != null) {
                task.setAssignedTo(assignedUser);
                logger.info("Task assigned to user: {}", assignedUser.getEmail());
            } else {
                logger.warn("Could not find user for assignment: {}", taskDetails.getAssignedTo());
                // Assign to current user if assignment fails
                task.setAssignedTo(currentUser);
            }
        } else {
            // Assign to current user if no specific assignment
            task.setAssignedTo(currentUser);
        }
        
        // Handle due date (deadline field)
        if (taskDetails.getDueDate() != null) {
            switch (taskDetails.getDueDate()) {
                case "TODAY":
                    task.setDeadline(LocalDate.now());
                    break;
                case "TOMORROW":
                    task.setDeadline(LocalDate.now().plusDays(1));
                    break;
                case "NEXT_WEEK":
                    task.setDeadline(LocalDate.now().plusWeeks(1));
                    break;
                case "FUTURE":
                    task.setDeadline(LocalDate.now().plusDays(7)); // Default to 1 week
                    break;
                default:
                    task.setDeadline(null);
            }
        }
        
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        
        Task savedTask = taskRepository.save(task);
        logger.info("Task created successfully with ID: {}", savedTask.getId());
        
        return TaskDTO.fromEntity(savedTask);
    }
}
