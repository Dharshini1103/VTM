package com.taskmanager.dto;

import com.taskmanager.entity.User;
import java.time.LocalDateTime;

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

    public UserDTO() {}

    public UserDTO(Long id, String email, String gmailId, String firstName, String lastName, 
                   String profilePhoto, Boolean isActive, User.UserRole role, 
                   Boolean calendarSynced, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.email = email;
        this.gmailId = gmailId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.profilePhoto = profilePhoto;
        this.isActive = isActive;
        this.role = role;
        this.calendarSynced = calendarSynced;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getGmailId() { return gmailId; }
    public void setGmailId(String gmailId) { this.gmailId = gmailId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public User.UserRole getRole() { return role; }
    public void setRole(User.UserRole role) { this.role = role; }

    public Boolean getCalendarSynced() { return calendarSynced; }
    public void setCalendarSynced(Boolean calendarSynced) { this.calendarSynced = calendarSynced; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

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