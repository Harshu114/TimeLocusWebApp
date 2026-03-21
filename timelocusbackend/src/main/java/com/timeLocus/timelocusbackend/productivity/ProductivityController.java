package com.timeLocus.timelocusbackend.productivity;

import com.timeLocus.timelocusbackend.productivity.dto.DashboardSummaryDTO;
import com.timeLocus.timelocusbackend.timetracker.TimeTrackerService;
import com.timeLocus.timelocusbackend.timetracker.dto.DailySummaryDTO;
import com.timeLocus.timelocusbackend.user.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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

    // GET /productivity/dashboard
    // Returns today's summary + weekly hours array in one call.
    // The frontend uses this to populate the Dashboard tab.
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardSummaryDTO> dashboard(
            @AuthenticationPrincipal User user) {

        DailySummaryDTO daily  = timeTrackerService.getDailySummary(user, LocalDate.now());
        List<DailySummaryDTO> weekly = timeTrackerService.getWeeklySummary(user);

        // Build Mon-Sun hours array (index 0 = Monday)
        double[] weekHours = new double[7];
        for (DailySummaryDTO d : weekly) {
            try {
                LocalDate date = LocalDate.parse(d.date(), DateTimeFormatter.ISO_LOCAL_DATE);
                int idx = date.getDayOfWeek().getValue() - 1; // Monday=0, Sunday=6
                weekHours[idx] = Math.round(d.totalMinutes() / 60.0 * 10.0) / 10.0;
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

    // GET /productivity/weekly
    // Returns 7 daily summary objects for Mon-Sun of the current week.
    // Used by the Progress tab charts.
    @GetMapping("/weekly")
    public ResponseEntity<List<DailySummaryDTO>> weekly(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(timeTrackerService.getWeeklySummary(user));
    }
}
