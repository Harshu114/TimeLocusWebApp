package com.timeLocus.timelocusbackend.planner;

import com.timeLocus.timelocusbackend.common.ApiResponse;
import com.timeLocus.timelocusbackend.user.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/planner")
public class PlannerController {

    @org.springframework.beans.factory.annotation.Autowired
    private PlannerRepository repo;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ── GET all events in range ───────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<EventDTO>> getEvents(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate f = from != null ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate t = to   != null ? to   : LocalDate.now().plusMonths(2);
        return ResponseEntity.ok(
                repo.findByUserAndEventDateBetweenOrderByEventDateAscEventTimeAsc(user, f, t)
                    .stream().map(this::toDTO).toList()
        );
    }

    // ── GET today's events ────────────────────────────────────────────────────
    @GetMapping("/today")
    public ResponseEntity<List<EventDTO>> getToday(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                repo.findByUserAndEventDateOrderByEventTimeAsc(user, LocalDate.now())
                    .stream().map(this::toDTO).toList()
        );
    }

    // ── POST create event ─────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<EventDTO> create(
            @AuthenticationPrincipal User user,
            @RequestBody CreateEventRequest req) {
        PlannerEvent ev = PlannerEvent.builder()
                .user(user)
                .title(req.title())
                .description(req.description())
                .eventDate(LocalDate.parse(req.date(), DATE_FMT))
                .eventTime(req.time() != null && !req.time().isBlank() ? LocalTime.parse(req.time(), TIME_FMT) : null)
                .eventType(req.eventType() != null ? req.eventType() : "work")
                .build();
        return ResponseEntity.ok(toDTO(repo.save(ev)));
    }

    // ── PATCH toggle done ─────────────────────────────────────────────────────
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<EventDTO> toggle(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        PlannerEvent ev = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        ev.setDone(!ev.isDone());
        return ResponseEntity.ok(toDTO(repo.save(ev)));
    }

    // ── DELETE event ──────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        PlannerEvent ev = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        repo.delete(ev);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────
    private EventDTO toDTO(PlannerEvent e) {
        return new EventDTO(
                e.getId(), e.getTitle(), e.getDescription(),
                e.getEventDate().format(DATE_FMT),
                e.getEventTime() != null ? e.getEventTime().format(TIME_FMT) : "",
                e.getEventType(), e.isDone()
        );
    }

    public record EventDTO(String id, String title, String description,
                           String date, String time, String eventType, boolean done) {}
    public record CreateEventRequest(@NotBlank String title, String description,
                                     @NotNull String date, String time, String eventType) {}
}
