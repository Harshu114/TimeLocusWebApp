package com.timeLocus.timelocusbackend.timetracker;

import com.timeLocus.timelocusbackend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, String> {

    List<TimeEntry> findByUserAndDateOrderByStartTimeAsc(User user, LocalDate date);

    List<TimeEntry> findByUserAndDateBetweenOrderByDateAscStartTimeAsc(
            User user, LocalDate from, LocalDate to);

    Optional<TimeEntry> findByIdAndUser(String id, User user);

    int countByUserAndDate(User user, LocalDate date);
}