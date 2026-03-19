package com.timeLocus.timelocusbackend.timetracker;

import com.timeLocus.timelocusbackend.common.ApiResponse;
import com.timeLocus.timelocusbackend.user.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/time-entries")
public class TimeTrackerController {

    private final TimeTrackerService service;

    public TimeTrackerController(TimeTrackerService service) {
        this.service = service;
    }

    /** GET /time-entries?date=2024-01-15 */
    @GetMapping
    public ResponseEntity<List<TimeEntryDTO>> getByDate(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.getEntriesForDate(user, date != null ? date : LocalDate.now()));
    }

    /** GET /time-entries/range?from=...&to=... */
    @GetMapping("/range")
    public ResponseEntity<List<TimeEntryDTO>> getRange(
            @AuthenticationPrincipal User user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getEntriesInRange(user, from, to));
    }

    /** GET /time-entries/summary/daily */
    @GetMapping("/summary/daily")
    public ResponseEntity<DailySummaryDTO> dailySummary(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.getDailySummary(user, date != null ? date : LocalDate.now()));
    }

    /** GET /time-entries/summary/weekly */
    @GetMapping("/summary/weekly")
    public ResponseEntity<List<DailySummaryDTO>> weeklySummary(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getWeeklySummary(user));
    }

    /** POST /time-entries */
    @PostMapping
    public ResponseEntity<TimeEntryDTO> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateEntryRequest req) {
        return ResponseEntity.ok(service.createEntry(user, req));
    }

    /** POST /time-entries/start */
    @PostMapping("/start")
    public ResponseEntity<TimeEntryDTO> startTimer(
            @AuthenticationPrincipal User user,
            @RequestBody StartTimerRequest req) {
        return ResponseEntity.ok(service.startTimer(user, req.task(), req.category()));
    }

    /** POST /time-entries/{id}/stop */
    @PostMapping("/{id}/stop")
    public ResponseEntity<TimeEntryDTO> stopTimer(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        return ResponseEntity.ok(service.stopTimer(user, id));
    }

    /** PUT /time-entries/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<TimeEntryDTO> update(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @Valid @RequestBody CreateEntryRequest req) {
        return ResponseEntity.ok(service.updateEntry(user, id, req));
    }

    /** DELETE /time-entries/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        service.deleteEntry(user, id);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record TimeEntryDTO(
            String  id,
            String  task,
            String  date,
            String  startTime,
            String  endTime,
            Integer duration,
            String  category,
            String  notes,
            boolean manual
    ) {}

    public record DailySummaryDTO(
            String                  date,
            int                     totalMinutes,
            double                  focusScore,
            int                     taskCount,
            List<CategoryBreakdown> breakdown
    ) {}

    public record CategoryBreakdown(
            String category,
            int    minutes,
            double percentage
    ) {}

    public record CreateEntryRequest(
            @NotBlank String task,
            String date,
            String startTime,
            String endTime,
            Integer duration,
            String category,
            String notes
    ) {}

    public record StartTimerRequest(String task, String category) {}
}