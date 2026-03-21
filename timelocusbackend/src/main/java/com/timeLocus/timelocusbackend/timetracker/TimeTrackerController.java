package com.timeLocus.timelocusbackend.timetracker;

import com.timeLocus.timelocusbackend.common.ApiResponse;
import com.timeLocus.timelocusbackend.timetracker.dto.*;
import com.timeLocus.timelocusbackend.user.User;
import jakarta.validation.Valid;
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

    // GET /time-entries?date=2024-01-15
    // Returns all time entries for the logged-in user on a specific date.
    @GetMapping
    public ResponseEntity<List<TimeEntryDTO>> getByDate(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(
                service.getEntriesForDate(user, date != null ? date : LocalDate.now())
        );
    }

    // GET /time-entries/range?from=2024-01-01&to=2024-01-31
    @GetMapping("/range")
    public ResponseEntity<List<TimeEntryDTO>> getRange(
            @AuthenticationPrincipal User user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getEntriesInRange(user, from, to));
    }

    // GET /time-entries/summary/daily
    // Returns total minutes, focus score, and breakdown by category for today.
    @GetMapping("/summary/daily")
    public ResponseEntity<DailySummaryDTO> dailySummary(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(
                service.getDailySummary(user, date != null ? date : LocalDate.now())
        );
    }

    // GET /time-entries/summary/weekly
    // Returns 7 daily summaries for Mon-Sun of the current week.
    @GetMapping("/summary/weekly")
    public ResponseEntity<List<DailySummaryDTO>> weeklySummary(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getWeeklySummary(user));
    }

    // POST /time-entries — save a manual entry
    @PostMapping
    public ResponseEntity<TimeEntryDTO> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateEntryRequest req) {
        return ResponseEntity.ok(service.createEntry(user, req));
    }

    // POST /time-entries/start — start a live timer, returns entry with id
    @PostMapping("/start")
    public ResponseEntity<TimeEntryDTO> startTimer(
            @AuthenticationPrincipal User user,
            @RequestBody StartTimerRequest req) {
        return ResponseEntity.ok(service.startTimer(user, req.task(), req.category()));
    }

    // POST /time-entries/{id}/stop — stop the timer, calculate duration
    @PostMapping("/{id}/stop")
    public ResponseEntity<TimeEntryDTO> stopTimer(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        return ResponseEntity.ok(service.stopTimer(user, id));
    }

    // PUT /time-entries/{id} — update an existing entry
    @PutMapping("/{id}")
    public ResponseEntity<TimeEntryDTO> update(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @Valid @RequestBody CreateEntryRequest req) {
        return ResponseEntity.ok(service.updateEntry(user, id, req));
    }

    // DELETE /time-entries/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        service.deleteEntry(user, id);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }
}
