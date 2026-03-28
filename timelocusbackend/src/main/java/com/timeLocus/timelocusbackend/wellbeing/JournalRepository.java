package com.timeLocus.timelocusbackend.wellbeing;

import com.timeLocus.timelocusbackend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface JournalRepository extends JpaRepository<Journal, String> {
    List<Journal> findByUserOrderByDateDesc(User user);
    Optional<Journal> findByIdAndUser(String id, User user);
    List<Journal> findByUserAndDateBetween(User user, LocalDate start, LocalDate end);
    long countByUser(User user);
}
