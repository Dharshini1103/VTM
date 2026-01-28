package com.taskmanager.repository;

import com.taskmanager.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    
    List<Task> findByCreatedById(Long userId);
    
    List<Task> findByAssignedToId(Long userId);
    
    List<Task> findByStatus(Task.TaskStatus status);
    
    @Query("SELECT t FROM Task t WHERE t.createdBy.id = :userId OR t.assignedTo.id = :userId")
    List<Task> findTasksByUserId(@Param("userId") Long userId);
    
    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :userId AND t.status != 'COMPLETED'")
    List<Task> findActiveTasksForUser(@Param("userId") Long userId);
    
    @Query("SELECT t FROM Task t WHERE t.deadline < :date AND t.status != 'COMPLETED'")
    List<Task> findOverdueTasks(@Param("date") LocalDateTime date);
    
    List<Task> findByPriority(Task.TaskPriority priority);
    
    @Query("SELECT t FROM Task t WHERE t.callScheduled = true AND t.id = :taskId")
    Optional<Task> findTaskWithScheduledCall(@Param("taskId") Long taskId);
    
    @Query("SELECT t FROM Task t WHERE t.status = 'PENDING' ORDER BY t.deadline ASC")
    List<Task> findUpcomingTasks();
}
