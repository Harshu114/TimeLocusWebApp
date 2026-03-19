package com.timeLocus.timelocusbackend.task;

import com.timeLocus.timelocusbackend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, String> {
    List<Task> findByUserOrderByCreatedAtDesc(User user);
    Optional<Task> findByIdAndUser(String id, User user);
    long countByUserAndDoneTrue(User user);
    long countByUser(User user);
}