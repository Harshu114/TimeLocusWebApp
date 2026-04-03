package com.timeLocus.timelocusbackend.wellbeing;

import com.timeLocus.timelocusbackend.common.ApiResponse;
import com.timeLocus.timelocusbackend.user.User;
import com.timeLocus.timelocusbackend.wellbeing.dto.CreateHabitRequest;
import com.timeLocus.timelocusbackend.wellbeing.dto.HabitDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/habits")
public class HabitController {

    @Autowired
    private HabitRepository repo;

    @GetMapping
    public ResponseEntity<List<HabitDTO>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(repo.findByUserOrderByCreatedAtDesc(user).stream().map(this::toDTO).toList());
    }

    @PostMapping
    @SuppressWarnings("null")
    public ResponseEntity<HabitDTO> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateHabitRequest req) {
        Habit h = Habit.builder().user(user).name(req.name()).build();
        return ResponseEntity.ok(toDTO(repo.save(h)));
    }

    @PatchMapping("/{id}/complete")
    @SuppressWarnings("null")
    public ResponseEntity<HabitDTO> complete(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody(required = false) LocalDate date) {
        Habit h = repo.findByIdAndUser(id, user).orElseThrow(() -> new RuntimeException("Habit not found"));
        if (date == null) date = LocalDate.now();
        if (h.getCompletedDates().add(date)) {
            h.setCurrentStreak(h.getCurrentStreak() + 1);
            if (h.getCurrentStreak() > h.getBestStreak()) {
                h.setBestStreak(h.getCurrentStreak());
            }
        }
        return ResponseEntity.ok(toDTO(repo.save(h)));
    }

    @DeleteMapping("/{id}")
    @SuppressWarnings("null")
    public ResponseEntity<ApiResponse<String>> delete(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        Habit h = repo.findByIdAndUser(id, user).orElseThrow(() -> new RuntimeException("Habit not found"));
        repo.delete(h);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    private HabitDTO toDTO(Habit h) {
        return new HabitDTO(h.getId(), h.getName(), h.getCurrentStreak(), h.getBestStreak(), h.getCompletedDates());
    }
}
