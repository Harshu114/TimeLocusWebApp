package com.timeLocus.timelocusbackend.planner;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.timeLocus.timelocusbackend.common.ApiResponse;
import com.timeLocus.timelocusbackend.planner.dto.CreateEventRequest;
import com.timeLocus.timelocusbackend.planner.dto.PlannerEventDTO;
import com.timeLocus.timelocusbackend.user.User;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/planner")
public class PlannerController {

    private final PlannerRepository repo;
    private final ObjectMapper       mapper = new ObjectMapper();

    public PlannerController(PlannerRepository repo) { this.repo = repo; }

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // GET /planner
    @GetMapping
    public ResponseEntity<List<PlannerEventDTO>> getEvents(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate f = from != null ? from : LocalDate.now().minusMonths(1);
        LocalDate t = to   != null ? to   : LocalDate.now().plusMonths(3);
        return ResponseEntity.ok(
                repo.findByUserAndEventDateBetweenOrderByEventDateAscEventTimeAsc(user, f, t)
                    .stream().map(this::toDTO).toList()
        );
    }

    // GET /planner/today
    @GetMapping("/today")
    public ResponseEntity<List<PlannerEventDTO>> getToday(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                repo.findByUserAndEventDateOrderByEventTimeAsc(user, LocalDate.now())
                    .stream().map(this::toDTO).toList()
        );
    }

    // POST /planner
    @PostMapping
    public ResponseEntity<PlannerEventDTO> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateEventRequest req) {

        // Serialize subtasks / tags if they come in as objects (from AI planner)
        String subtasksJson = safeJson(req.subtasksJson());
        String tagsJson     = safeJson(req.tagsJson());

        PlannerEvent ev = PlannerEvent.builder()
                .user(user)
                .title(req.title())
                .description(req.description())
                .eventDate(LocalDate.parse(req.date(), DATE_FMT))
                .eventTime(req.time() != null && !req.time().isBlank()
                        ? LocalTime.parse(req.time(), TIME_FMT) : null)
                .eventType(req.eventType() != null ? req.eventType() : "work")
                .priority(req.priority() != null ? req.priority() : "medium")
                .notes(req.notes())
                .subtasksJson(subtasksJson)
                .tagsJson(tagsJson)
                .estimatedMins(req.estimatedMins())
                .aiGenerated(req.aiGenerated() != null && req.aiGenerated())
                .build();

        return ResponseEntity.ok(toDTO(repo.save(ev)));
    }

    // PATCH /planner/{id}/toggle — toggle event done/undone
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<PlannerEventDTO> toggle(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        PlannerEvent ev = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        ev.setDone(!ev.isDone());
        return ResponseEntity.ok(toDTO(repo.save(ev)));
    }

    // PATCH /planner/{id}/subtask/{subtaskId} — toggle individual subtask
    @PatchMapping("/{id}/subtask/{subtaskId}")
    public ResponseEntity<PlannerEventDTO> toggleSubtask(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @PathVariable String subtaskId) {
        PlannerEvent ev = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        try {
            String json = ev.getSubtasksJson();
            if (json == null || json.isBlank()) return ResponseEntity.ok(toDTO(ev));

            ArrayNode arr = (ArrayNode) mapper.readTree(json);
            for (JsonNode node : arr) {
                if (subtaskId.equals(node.path("id").asText())) {
                    ((com.fasterxml.jackson.databind.node.ObjectNode) node)
                        .put("done", !node.path("done").asBoolean());
                    break;
                }
            }
            ev.setSubtasksJson(mapper.writeValueAsString(arr));

            // Auto-complete event when all subtasks done
            boolean allDone = true;
            for (JsonNode n : arr) { if (!n.path("done").asBoolean()) { allDone = false; break; } }
            if (allDone && arr.size() > 0) ev.setDone(true);

        } catch (Exception ignored) {}
        return ResponseEntity.ok(toDTO(repo.save(ev)));
    }

    // PATCH /planner/{id} — update notes / priority / other fields
    @PatchMapping("/{id}")
    public ResponseEntity<PlannerEventDTO> update(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody Map<String, Object> fields) {
        PlannerEvent ev = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        if (fields.containsKey("notes"))    ev.setNotes((String) fields.get("notes"));
        if (fields.containsKey("priority")) ev.setPriority((String) fields.get("priority"));
        if (fields.containsKey("title"))    ev.setTitle((String) fields.get("title"));
        return ResponseEntity.ok(toDTO(repo.save(ev)));
    }

    // DELETE /planner/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        PlannerEvent ev = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        repo.delete(ev);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private PlannerEventDTO toDTO(PlannerEvent e) {
        return new PlannerEventDTO(
                e.getId(), e.getTitle(), e.getDescription(),
                e.getEventDate().format(DATE_FMT),
                e.getEventTime() != null ? e.getEventTime().format(TIME_FMT) : "",
                e.getEventType(), e.isDone(),
                e.getPriority(), e.getNotes(),
                e.getSubtasksJson(), e.getTagsJson(),
                e.getEstimatedMins(), e.isAiGenerated()
        );
    }

    /** Accept either a JSON string or null; return clean JSON string or null */
    private String safeJson(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try { mapper.readTree(raw); return raw; } // already valid JSON
        catch (Exception e) { return null; }
    }
}