package com.timeLocus.timelocusbackend.focus;

import com.timeLocus.timelocusbackend.common.ApiResponse;
import com.timeLocus.timelocusbackend.focus.dto.CompleteSessionRequest;
import com.timeLocus.timelocusbackend.focus.dto.FocusTodayDTO;
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

    // POST /focus/complete — save a completed focus session to the DB
    @PostMapping("/complete")
    public ResponseEntity<ApiResponse<String>> complete(
            @AuthenticationPrincipal User user,
            @RequestBody CompleteSessionRequest req) {
        repo.save(new FocusSession(
                user,
                req.mode() != null ? req.mode() : "pomodoro",
                req.durationMinutes()
        ));
        return ResponseEntity.ok(ApiResponse.success("Session saved"));
    }

    // GET /focus/today — how many sessions and total minutes today
    @GetMapping("/today")
    public ResponseEntity<FocusTodayDTO> todayStats(@AuthenticationPrincipal User user) {
        LocalDate today = LocalDate.now();
        return ResponseEntity.ok(new FocusTodayDTO(
                repo.countByUserAndDate(user, today),
                repo.sumMinutesByUserAndDate(user, today)
        ));
    }
}
