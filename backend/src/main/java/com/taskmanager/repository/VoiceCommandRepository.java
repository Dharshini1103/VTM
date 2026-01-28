package com.taskmanager.repository;

import com.taskmanager.entity.VoiceCommand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VoiceCommandRepository extends JpaRepository<VoiceCommand, Long> {
    
    List<VoiceCommand> findByUserId(Long userId);
    
    @Query("SELECT v FROM VoiceCommand v WHERE v.user.id = :userId AND v.createdAt >= :since")
    List<VoiceCommand> findRecentCommandsByUser(@Param("userId") Long userId, @Param("since") LocalDateTime since);
    
    List<VoiceCommand> findByIntent(VoiceCommand.CommandIntent intent);
    
    @Query("SELECT v FROM VoiceCommand v WHERE v.user.id = :userId AND v.intent = :intent")
    List<VoiceCommand> findCommandsByUserAndIntent(@Param("userId") Long userId, @Param("intent") VoiceCommand.CommandIntent intent);
    
    @Query("SELECT v FROM VoiceCommand v WHERE v.processedSuccessfully = true AND v.taskId = :taskId")
    List<VoiceCommand> findProcessedCommandsForTask(@Param("taskId") Long taskId);
}
