package com.timeLocus.timelocusbackend.focus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DistractionBlockRepository extends JpaRepository<DistractionBlock, String> {
    List<DistractionBlock> findByUserId(String userId);

    List<DistractionBlock> findByUserIdAndBlockedTrue(String userId);

    @Query("SELECT db FROM DistractionBlock db JOIN db.session s WHERE s.user.id = :userId AND s.sessionDate = :date")
    List<DistractionBlock> findByUserIdAndDate(@Param("userId") String userId, @Param("date") LocalDate date);

    long countByUserIdAndBlockedTrue(String userId);
}
