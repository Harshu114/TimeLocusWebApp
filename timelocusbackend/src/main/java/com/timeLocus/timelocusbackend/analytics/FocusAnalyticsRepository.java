package com.timeLocus.timelocusbackend.analytics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FocusAnalyticsRepository extends JpaRepository<FocusAnalytics, String> {
    Optional<FocusAnalytics> findByUserIdAndDate(String userId, LocalDate date);

    List<FocusAnalytics> findByUserIdOrderByDateDesc(String userId);

    @Query("SELECT fa FROM FocusAnalytics fa WHERE fa.user.id = :userId AND fa.date BETWEEN :startDate AND :endDate ORDER BY fa.date ASC")
    List<FocusAnalytics> findByUserIdAndDateRange(
        @Param("userId") String userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT SUM(fa.totalMinutes) FROM FocusAnalytics fa WHERE fa.user.id = :userId AND fa.date >= :startDate")
    Long sumTotalMinutesByUserIdAndDateAfter(@Param("userId") String userId, @Param("startDate") LocalDate startDate);

    @Query("SELECT SUM(fa.totalSessions) FROM FocusAnalytics fa WHERE fa.user.id = :userId AND fa.date >= :startDate")
    Long sumTotalSessionsByUserIdAndDateAfter(@Param("userId") String userId, @Param("startDate") LocalDate startDate);
}
