package com.timeLocus.timelocusbackend.focus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FocusSettingsRepository extends JpaRepository<FocusSettings, String> {
    Optional<FocusSettings> findByUserId(String userId);

    @Query("SELECT fs FROM FocusSettings fs JOIN FETCH fs.user u WHERE u.id = :userId")
    Optional<FocusSettings> findByUserIdWithUser(@Param("userId") String userId);

    boolean existsByUserId(String userId);
}
