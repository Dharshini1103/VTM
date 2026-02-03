package com.taskmanager.controller;

import com.taskmanager.dto.UserDTO;
import com.taskmanager.dto.response.ApiResponse;
import com.taskmanager.exception.UnauthorizedException;
import com.taskmanager.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;  

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllTeamMembers() {
        List<UserDTO> users = userService.getAllTeamMembers();
        return ResponseEntity.ok(ApiResponse.success("Team members retrieved", users));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("All users retrieved", users));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long userId) {
        UserDTO user = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success("User retrieved", user));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser() {
        Long currentUserId = getCurrentUserId();
        UserDTO user = userService.getUserById(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Current user retrieved", user));
    }

    // Helper to resolve current user's ID from security context
    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getName() != null) {
                String email = authentication.getName();
                logger.debug("Authentication name from context: {}", email);
                UserDTO user = userService.getUserByEmail(email);
                logger.debug("Resolved current user: id={}, email={}, role={}", user.getId(), user.getEmail(), user.getRole());
                return user.getId();
            }
            logger.warn("No authentication present when resolving current user");
            throw new UnauthorizedException("Unable to determine current user");
        } catch (UnauthorizedException ue) {
            throw ue;
        } catch (Exception e) {
            logger.error("Error determining current user", e);
            throw new UnauthorizedException("Unable to determine current user");
        }
    }

    @PostMapping("/super-admin")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<com.taskmanager.dto.response.LoginResponse>> createSuperAdmin(@RequestBody com.taskmanager.dto.request.RegisterRequest request) {
        Long currentUserId = getCurrentUserId();
        com.taskmanager.dto.response.LoginResponse resp = userService.createSuperAdmin(request, currentUserId);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("SUPER_ADMIN created", resp));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(@PathVariable Long userId, @RequestBody UserDTO userDTO) {
        // Determine current user from security context
        Long currentUserId = getCurrentUserId();
        UserDTO updatedUser = userService.updateUser(userId, userDTO, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", updatedUser));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable Long userId) {
        // Determine current user from security context
        Long currentUserId = getCurrentUserId();
        userService.deactivateUser(userId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("User deactivated successfully"));
    }

    @DeleteMapping("/{userId}/permanent")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUserPermanently(@PathVariable Long userId) {
        // Determine current user from security context
        Long currentUserId = getCurrentUserId();
        userService.deleteUserPermanently(userId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
    }


}
