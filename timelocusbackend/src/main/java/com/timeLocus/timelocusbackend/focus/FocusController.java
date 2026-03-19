package com.timeLocus.timelocusbackend.focus;

import com.timeLocus.timelocusbackend.common.ApiResponse;
import com.timeLocus.timelocusbackend.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/focus")
public class FocusController {

    @Autowired
    private FocusSessionRepository repo;

    @PostMapping("/complete")
    public ResponseEntity<ApiResponse<String>> complete(
            @AuthenticationPrincipal User user,
            @RequestBody CompleteRequest req) {
        repo.save(new FocusSession(user,
                req.mode() != null ? req.mode() : "pomodoro",
                req.durationMinutes()));
        return ResponseEntity.ok(ApiResponse.success("Session saved"));
    }

    @GetMapping("/today")
    public ResponseEntity<TodayStatsDTO> todayStats(@AuthenticationPrincipal User user) {
        LocalDate today    = LocalDate.now();
        long      sessions = repo.countByUserAndDate(user, today);
        int       minutes  = repo.sumMinutesByUserAndDate(user, today);
        return ResponseEntity.ok(new TodayStatsDTO(sessions, minutes));
    }

    public record CompleteRequest(String mode, int durationMinutes) {}
    public record TodayStatsDTO(long sessions, int totalMinutes) {}
}