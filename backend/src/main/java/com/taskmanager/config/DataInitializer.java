package com.taskmanager.config;

import com.taskmanager.dto.request.RegisterRequest;
import com.taskmanager.service.UserService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer {

    private final UserService userService;

    @Value("${app.init.superadmin.email:}")
    private String superAdminEmail;

    @Value("${app.init.superadmin.password:}")
    private String superAdminPassword;

    @Value("${app.init.superadmin.firstName:Admin}")
    private String superAdminFirstName;

    @Value("${app.init.superadmin.lastName:Admin}")
    private String superAdminLastName;

    public DataInitializer(UserService userService) {
        this.userService = userService;
    }

    @PostConstruct
    public void createInitialSuperAdmin() {
        try {
            if (superAdminEmail != null && !superAdminEmail.isBlank() && superAdminPassword != null && !superAdminPassword.isBlank()) {
                // Create a RegisterRequest for SUPER_ADMIN
                RegisterRequest req = new RegisterRequest();
                req.setGmailId(superAdminEmail);
                req.setFirstName(superAdminFirstName);
                req.setLastName(superAdminLastName);
                req.setPassword(superAdminPassword);
                req.setRole(com.taskmanager.entity.User.UserRole.SUPER_ADMIN);

                // Attempt to create only if none exists (createSuperAdmin allows null currentUserId for first creation)
                try {
                    userService.createSuperAdmin(req, null);
                    System.out.println("Initial SUPER_ADMIN created: " + superAdminEmail);
                } catch (Exception e) {
                    // If already exists or other error, ignore to avoid failing startup
                    System.out.println("SUPER_ADMIN initialization skipped: " + e.getMessage());
                }
            } else {
                System.out.println("SUPER_ADMIN initialization skipped: no credentials provided in environment");
            }
        } catch (Exception e) {
            System.out.println("Error during SUPER_ADMIN initialization: " + e.getMessage());
        }
    }
}