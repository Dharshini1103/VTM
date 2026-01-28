package com.taskmanager.repository;

import com.taskmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
