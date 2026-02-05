package com.taskmanager.service;

import com.taskmanager.dto.UserDTO;
import com.taskmanager.dto.request.LoginRequest;
import com.taskmanager.dto.request.RegisterRequest;
import com.taskmanager.dto.response.LoginResponse;
import com.taskmanager.entity.User;
import com.taskmanager.entity.Task;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getGmailId())) {
            throw new RuntimeException("Gmail ID already exists");
        }

        User user = new User();
        user.setEmail(request.getGmailId()); // Use gmailId as email
        user.setGmailId(request.getGmailId());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setIsActive(true);
        user.setRole(request.getRole() != null ? request.getRole() : User.UserRole.USER);
        user.setJobTitle(request.getJobTitle());
        user.setDepartment(request.getDepartment());
        user.setCalendarSynced(false);

        User savedUser = userRepository.save(user);

        String token = tokenProvider.generateToken(savedUser.getId(), savedUser.getEmail());
        return new LoginResponse(token, 86400000L, UserDTO.fromEntity(savedUser));
    }

    /**
     * Create a SUPER_ADMIN explicitly. If there are already SUPER_ADMINs present, the caller
     * must be a SUPER_ADMIN (validated using currentUserId). If none exist, this method
     * can be used to bootstrap the first SUPER_ADMIN by passing null for currentUserId and
     * ensuring request contains SUPER_ADMIN role.
     */
    public LoginResponse createSuperAdmin(RegisterRequest request, Long currentUserId) {
        // If SUPER_ADMINs exist, require caller to be SUPER_ADMIN
        List<User> existing = userRepository.findByRole(User.UserRole.SUPER_ADMIN);
        if (!existing.isEmpty()) {
            if (currentUserId == null) {
                throw new RuntimeException("Only SUPER_ADMIN can create another SUPER_ADMIN");
            }
            User currentUser = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("Current user not found with id: " + currentUserId));
            if (!currentUser.getRole().equals(User.UserRole.SUPER_ADMIN)) {
                throw new RuntimeException("Only SUPER_ADMIN can create another SUPER_ADMIN");
            }
        }

        if (userRepository.existsByEmail(request.getGmailId())) {
            throw new RuntimeException("Gmail ID already exists");
        }

        if (request.getRole() == null || !request.getRole().equals(User.UserRole.SUPER_ADMIN)) {
            throw new com.taskmanager.exception.BadRequestException("Role must be SUPER_ADMIN to create a super admin");
        }

        User user = new User();
        user.setEmail(request.getGmailId());
        user.setGmailId(request.getGmailId());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setIsActive(true);
        user.setRole(User.UserRole.SUPER_ADMIN);
        user.setJobTitle(request.getJobTitle());
        user.setDepartment(request.getDepartment());
        user.setCalendarSynced(false);

        User savedUser = userRepository.save(user);
        String token = tokenProvider.generateToken(savedUser.getId(), savedUser.getEmail());
        return new LoginResponse(token, 86400000L, UserDTO.fromEntity(savedUser));

    }


    public LoginResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getGmailId());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid credentials");
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());
        return new LoginResponse(token, 86400000L, UserDTO.fromEntity(user));
    }

    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return UserDTO.fromEntity(user);
    }

    public UserDTO getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return UserDTO.fromEntity(user);
    }

    public UserDTO getUserByGmailId(String gmailId) {
        User user = userRepository.findByGmailId(gmailId)
                .orElseThrow(() -> new RuntimeException("User not found with Gmail ID: " + gmailId));
        return UserDTO.fromEntity(user);
    }

    public List<UserDTO> getAllTeamMembers() {
        List<User> users = userRepository.findByIsActiveTrue();
        return users.stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public UserDTO updateUser(Long userId, UserDTO updateRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if (updateRequest.getFirstName() != null) {
            user.setFirstName(updateRequest.getFirstName());
        }
        if (updateRequest.getLastName() != null) {
            user.setLastName(updateRequest.getLastName());
        }
        if (updateRequest.getEmail() != null) {
            user.setEmail(updateRequest.getEmail());
        }
        if (updateRequest.getProfilePhoto() != null) {
            user.setProfilePhoto(updateRequest.getProfilePhoto());
        }
        if (updateRequest.getRole() != null) {
            // Only ADMIN can change roles (validation enforced in the overload that takes currentUserId)
            user.setRole(updateRequest.getRole());
        }
        if (updateRequest.getIsActive() != null) {
            // Only ADMIN can change active status (validation enforced in the overload that takes currentUserId)
            user.setIsActive(updateRequest.getIsActive());
        }

        // Allow setting/changing manager via update request when provided


        User updatedUser = userRepository.save(user);
        return UserDTO.fromEntity(updatedUser);
    }

    public UserDTO updateUser(Long userId, UserDTO updateRequest, Long currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found with id: " + currentUserId));
        
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Target user not found with id: " + userId));
        
        // RBAC validation: Check if current user can update target user
        validateUserUpdatePermission(currentUser, targetUser);
        
        // Additional check: only SUPER_ADMIN can assign SUPER_ADMIN role
        if (updateRequest.getRole() != null && updateRequest.getRole().equals(User.UserRole.SUPER_ADMIN)
                && !currentUser.getRole().equals(User.UserRole.SUPER_ADMIN)) {
            throw new RuntimeException("Only SUPER_ADMIN can assign SUPER_ADMIN role");
        }

        return updateUser(userId, updateRequest);
    }

    private void validateUserUpdatePermission(User currentUser, User targetUser) {
        // Users can only update their own profile
        if (currentUser.getId().equals(targetUser.getId())) {
            // Users can update their own basic info but not role or active status
            return;
        }
        
        // SUPER_ADMIN can update anyone except other SUPER_ADMIN
        if (currentUser.getRole().equals(User.UserRole.SUPER_ADMIN)) {
            if (targetUser.getRole().equals(User.UserRole.SUPER_ADMIN)) {
                throw new RuntimeException("SUPER_ADMIN cannot modify other SUPER_ADMIN");
            }
            return;
        }
        
        // ADMIN can update MANAGER and USER, but not ADMIN or SUPER_ADMIN
        if (currentUser.getRole().equals(User.UserRole.ADMIN)) {
            if (targetUser.getRole().equals(User.UserRole.ADMIN) || targetUser.getRole().equals(User.UserRole.SUPER_ADMIN)) {
                throw new RuntimeException("ADMIN cannot modify ADMIN or SUPER_ADMIN");
            }
            return;
        }
        
        // MANAGER cannot update other users
        if (currentUser.getRole().equals(User.UserRole.MANAGER)) {
            throw new RuntimeException("MANAGER cannot update other users");
        }
        
        // USER cannot update other users
        throw new RuntimeException("USER cannot update other users");
    }

    public void deactivateUser(Long userId, Long currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found with id: " + currentUserId));
        
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        logger.debug("Attempting deactivation: currentUser id={} role={} -> targetUser id={} role={}", currentUser.getId(), currentUser.getRole(), targetUser.getId(), targetUser.getRole());
        // Validate deactivation permission
        validateUserDeactivationPermission(currentUser, targetUser);
        
        targetUser.setIsActive(false);
        userRepository.save(targetUser);
    }

    private void validateUserDeactivationPermission(User currentUser, User targetUser) {
        // Cannot deactivate yourself
        if (currentUser.getId().equals(targetUser.getId())) {
            throw new RuntimeException("Cannot deactivate your own account");
        }
        
        // SUPER_ADMIN can deactivate anyone except other SUPER_ADMIN
        if (currentUser.getRole().equals(User.UserRole.SUPER_ADMIN)) {
            if (targetUser.getRole().equals(User.UserRole.SUPER_ADMIN)) {
                throw new RuntimeException("SUPER_ADMIN cannot deactivate other SUPER_ADMIN");
            }
            return;
        }
        
        // ADMIN can deactivate MANAGER and USER, but not ADMIN or SUPER_ADMIN
        if (currentUser.getRole().equals(User.UserRole.ADMIN)) {
            if (targetUser.getRole().equals(User.UserRole.ADMIN) || targetUser.getRole().equals(User.UserRole.SUPER_ADMIN)) {
                throw new RuntimeException("ADMIN cannot deactivate ADMIN or SUPER_ADMIN");
            }
            return;
        }
        
        // MANAGER and USER cannot deactivate others
        throw new RuntimeException("Only ADMIN and SUPER_ADMIN can deactivate users");
    }

    public void deleteUserPermanently(Long userId, Long currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found with id: " + currentUserId));
        
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        logger.debug("Attempting permanent delete: currentUser id={} role={} -> targetUser id={} role={}", currentUser.getId(), currentUser.getRole(), targetUser.getId(), targetUser.getRole());
        
        // Only SUPER_ADMIN can permanently delete users
        if (!currentUser.getRole().equals(User.UserRole.SUPER_ADMIN)) {
            throw new RuntimeException("Only SUPER_ADMIN can permanently delete users");
        }
        
        // Allow self-deletion for SUPER_ADMIN
        if (!currentUser.getId().equals(targetUser.getId())) {
            // SUPER_ADMIN cannot delete other SUPER_ADMIN (but can delete themselves)
            if (targetUser.getRole().equals(User.UserRole.SUPER_ADMIN)) {
                throw new RuntimeException("SUPER_ADMIN cannot delete other SUPER_ADMIN");
            }
        }
        
        // Find all tasks associated with this user
        List<Task> createdByTasks = taskRepository.findByCreatedById(userId);
        List<Task> assignedToTasks = taskRepository.findByAssignedToId(userId);
        
        // Handle tasks created by this user - set createdBy to null or reassign
        for (Task task : createdByTasks) {
            task.setCreatedBy(null);
            taskRepository.save(task);
        }
        
        // Handle tasks assigned to this user - set assignedTo to null
        for (Task task : assignedToTasks) {
            task.setAssignedTo(null);
            taskRepository.save(task);
        }
        
        // Now delete the user
        userRepository.delete(targetUser);
    }

    // Helper methods for role hierarchy
    public boolean canManageUser(User manager, User target) {
        if (manager.getRole().equals(User.UserRole.SUPER_ADMIN)) {
            return !target.getRole().equals(User.UserRole.SUPER_ADMIN);
        }
        
        if (manager.getRole().equals(User.UserRole.ADMIN)) {
            return target.getRole().equals(User.UserRole.MANAGER) || target.getRole().equals(User.UserRole.USER);
        }
        
        return false;
    }

    public List<UserDTO> getTeamMembers(Long managerId) {
        List<User> teamMembers = userRepository.findTeamMembers(managerId);
        return teamMembers.stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getUsersByDepartment(String department) {
        List<User> users = userRepository.findActiveUsersByDepartment(department);
        return users.stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
