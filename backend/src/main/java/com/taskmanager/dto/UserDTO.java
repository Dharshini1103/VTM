package com.taskmanager.dto;

import com.taskmanager.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String gmailId;
    private String firstName;
    private String lastName;
    private String profilePhoto;
    private Boolean isActive;
    private User.UserRole role;
    private Boolean calendarSynced;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static UserDTO fromEntity(User user) {
        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getGmailId(),
                user.getFirstName(),
                user.getLastName(),
                user.getProfilePhoto(),
                user.getIsActive(),
                user.getRole(),
                user.getCalendarSynced(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}