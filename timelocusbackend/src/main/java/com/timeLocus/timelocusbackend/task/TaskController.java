package com.timeLocus.timelocusbackend.task;

import com.timeLocus.timelocusbackend.common.ApiResponse;
import com.timeLocus.timelocusbackend.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    @Autowired
    private TaskRepository repo;

    @GetMapping
    public ResponseEntity<List<TaskDTO>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
            repo.findByUserOrderByCreatedAtDesc(user)
                .stream().map(this::toDTO).toList()
        );
    }

    @PostMapping
    public ResponseEntity<TaskDTO> create(
            @AuthenticationPrincipal User user,
            @RequestBody CreateTaskRequest req) {
        Task t = Task.builder()
                .user(user)
                .title(req.title())
                .priority(req.priority() != null ? req.priority() : "medium")
                .build();
        return ResponseEntity.ok(toDTO(repo.save(t)));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<TaskDTO> toggle(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        Task t = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        t.setDone(!t.isDone());
        return ResponseEntity.ok(toDTO(repo.save(t)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> update(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody CreateTaskRequest req) {
        Task t = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        if (req.title()    != null) t.setTitle(req.title());
        if (req.priority() != null) t.setPriority(req.priority());
        return ResponseEntity.ok(toDTO(repo.save(t)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        Task t = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        repo.delete(t);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    @GetMapping("/stats")
    public ResponseEntity<TaskStatsDTO> stats(@AuthenticationPrincipal User user) {
        long total = repo.countByUser(user);
        long done  = repo.countByUserAndDoneTrue(user);
        return ResponseEntity.ok(new TaskStatsDTO(total, done));
    }

    private TaskDTO toDTO(Task t) {
        return new TaskDTO(
                t.getId(), t.getTitle(), t.isDone(), t.getPriority(),
                t.getDueDate() != null ? t.getDueDate().toString() : null
        );
    }

    public record TaskDTO(String id, String title, boolean done, String priority, String dueDate) {}
    public record CreateTaskRequest(String title, String priority) {}
    public record TaskStatsDTO(long total, long done) {}
}