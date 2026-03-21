package com.timeLocus.timelocusbackend.task;

import com.timeLocus.timelocusbackend.common.ApiResponse;
import com.timeLocus.timelocusbackend.task.dto.CreateTaskRequest;
import com.timeLocus.timelocusbackend.task.dto.TaskDTO;
import com.timeLocus.timelocusbackend.task.dto.TaskStatsDTO;
import com.timeLocus.timelocusbackend.user.User;
import jakarta.validation.Valid;
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

    // GET /tasks — all tasks for logged-in user, newest first
    @GetMapping
    public ResponseEntity<List<TaskDTO>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                repo.findByUserOrderByCreatedAtDesc(user)
                    .stream().map(this::toDTO).toList()
        );
    }

    // POST /tasks — create a new task
    @PostMapping
    public ResponseEntity<TaskDTO> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateTaskRequest req) {
        Task t = Task.builder()
                .user(user)
                .title(req.title())
                .priority(req.priority() != null ? req.priority() : "medium")
                .build();
        return ResponseEntity.ok(toDTO(repo.save(t)));
    }

    // PATCH /tasks/{id}/toggle — flip done/undone
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<TaskDTO> toggle(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        Task t = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        t.setDone(!t.isDone());
        return ResponseEntity.ok(toDTO(repo.save(t)));
    }

    // PUT /tasks/{id} — update title or priority
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

    // DELETE /tasks/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        Task t = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        repo.delete(t);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // GET /tasks/stats — count total and done tasks
    @GetMapping("/stats")
    public ResponseEntity<TaskStatsDTO> stats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(new TaskStatsDTO(
                repo.countByUser(user),
                repo.countByUserAndDoneTrue(user)
        ));
    }

    private TaskDTO toDTO(Task t) {
        return new TaskDTO(
                t.getId(), t.getTitle(), t.isDone(), t.getPriority(),
                t.getDueDate() != null ? t.getDueDate().toString() : null
        );
    }
}
