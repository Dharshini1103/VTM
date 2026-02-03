package com.taskmanager.dto.request;

import jakarta.validation.constraints.*;

public class LoginRequest {
    
    @NotBlank(message = "Gmail ID is required")
    @Email(message = "Gmail ID should be valid")
    private String gmailId;
    
    @NotBlank(message = "Password is required")
    private String password;
    
    // Getters and setters
    public String getGmailId() { return gmailId; }
    public void setGmailId(String gmailId) { this.gmailId = gmailId; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
