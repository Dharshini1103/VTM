package com.taskmanager.repository;

import com.taskmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGmailId(String gmailId);
    List<User> findByIsActiveTrue();
    boolean existsByEmail(String email);
    List<User> findByRole(User.UserRole role);
    List<User> findByManagerId(Long managerId);
    
    @Query("SELECT u FROM User u WHERE u.manager.id = :managerId")
    List<User> findTeamMembers(@Param("managerId") Long managerId);
    
    @Query("SELECT u FROM User u WHERE u.department = :department AND u.isActive = true")
    List<User> findActiveUsersByDepartment(@Param("department") String department);
    
    @Query("SELECT u FROM User u WHERE u.role != :role AND u.isActive = true")
    List<User> findActiveUsersExceptRole(@Param("role") User.UserRole role);
}
