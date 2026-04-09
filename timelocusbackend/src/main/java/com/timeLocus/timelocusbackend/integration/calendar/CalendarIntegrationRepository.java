package com.timeLocus.timelocusbackend.integration.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CalendarIntegrationRepository extends JpaRepository<CalendarIntegration, String> {
    Optional<CalendarIntegration> findByUserId(String userId);

    boolean existsByUserId(String userId);
}
