package com.timeLocus.timelocusbackend.planner;

import com.timeLocus.timelocusbackend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PlannerRepository extends JpaRepository<PlannerEvent, String> {

    List<PlannerEvent> findByUserAndEventDateOrderByEventTimeAsc(
            User user, LocalDate date);

    List<PlannerEvent> findByUserAndEventDateBetweenOrderByEventDateAscEventTimeAsc(
            User user, LocalDate from, LocalDate to);

    Optional<PlannerEvent> findByIdAndUser(String id, User user);
}