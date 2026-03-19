package com.timeLocus.timelocusbackend.focus;

import com.timeLocus.timelocusbackend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;

public interface FocusSessionRepository extends JpaRepository<FocusSession, String> {

    @Query("SELECT COUNT(f) FROM FocusSession f WHERE f.user = :user AND f.sessionDate = :date")
    long countByUserAndDate(User user, LocalDate date);

    @Query("SELECT COALESCE(SUM(f.durationMinutes), 0) FROM FocusSession f WHERE f.user = :user AND f.sessionDate = :date")
    int sumMinutesByUserAndDate(User user, LocalDate date);
}