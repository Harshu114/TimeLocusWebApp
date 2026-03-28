package com.timeLocus.timelocusbackend.wellbeing;

import com.timeLocus.timelocusbackend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HabitRepository extends JpaRepository<Habit, String> {
    List<Habit> findByUserOrderByCreatedAtDesc(User user);
    Optional<Habit> findByIdAndUser(String id, User user);
    long countByUser(User user);
}
