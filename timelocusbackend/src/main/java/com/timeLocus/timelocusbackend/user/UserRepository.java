package com.timeLocus.timelocusbackend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetPasswordToken(String token);
    boolean existsByEmail(String email);
    @Query("select u from User u where lower(trim(u.email)) = lower(trim(:email))")
    Optional<User> findByNormalizedEmail(@Param("email") String email);
    @Query("select count(u) > 0 from User u where lower(trim(u.email)) = lower(trim(:email))")
    boolean existsByNormalizedEmail(@Param("email") String email);
}
