package com.timeLocus.timelocusbackend.productivity;

import com.timeLocus.timelocusbackend.focus.FocusController;
import com.timeLocus.timelocusbackend.task.TaskController;
import com.timeLocus.timelocusbackend.timetracker.TimeTrackerController;
import com.timeLocus.timelocusbackend.timetracker.TimeTrackerService;
import com.timeLocus.timelocusbackend.user.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/productivity")
public class ProductivityController {

    private final TimeTrackerService timeTrackerService;

    public ProductivityController(TimeTrackerService timeTrackerService) {
        this.timeTrackerService = timeTrackerService;
    }

    // ── Full dashboard summary ────────────────────────────────────────────────
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardSummaryDTO> dashboard(@AuthenticationPrincipal User user) {
        // Daily summary
        var daily   = timeTrackerService.getDailySummary(user, LocalDate.now());
        // Weekly summaries
        var weekly  = timeTrackerService.getWeeklySummary(user);

        // Build week hours array [Mon..Sun]
        double[] weekHours = new double[7];
        for (var d : weekly) {
            try {
                LocalDate date  = LocalDate.parse(d.date(), DateTimeFormatter.ISO_LOCAL_DATE);
                int dayIdx = date.getDayOfWeek().getValue() - 1; // Mon=0
                weekHours[dayIdx] = Math.round(d.totalMinutes() / 60.0 * 10.0) / 10.0;
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(new DashboardSummaryDTO(
                daily.totalMinutes(),
                daily.focusScore(),
                daily.taskCount(),
                daily.breakdown(),
                weekHours
        ));
    }

    // ── Weekly summary (for progress tab) ────────────────────────────────────
    @GetMapping("/weekly")
    public ResponseEntity<List<TimeTrackerController.DailySummaryDTO>> weekly(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(timeTrackerService.getWeeklySummary(user));
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────
    public record DashboardSummaryDTO(
            int    todayMinutes,
            double focusScore,
            int    taskCount,
            List<TimeTrackerController.CategoryBreakdown> breakdown,
            double[] weekHours
    ) {}
}
