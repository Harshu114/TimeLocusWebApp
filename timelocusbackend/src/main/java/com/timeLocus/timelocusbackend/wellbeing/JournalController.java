package com.timeLocus.timelocusbackend.wellbeing;

import com.timeLocus.timelocusbackend.common.ApiResponse;
import com.timeLocus.timelocusbackend.user.User;
import com.timeLocus.timelocusbackend.wellbeing.dto.CreateJournalRequest;
import com.timeLocus.timelocusbackend.wellbeing.dto.JournalDTO;
import com.timeLocus.timelocusbackend.wellbeing.dto.MoodStatsDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/journal")
public class JournalController {

    @Autowired
    private JournalRepository repo;

    @GetMapping
    public ResponseEntity<List<JournalDTO>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(repo.findByUserOrderByDateDesc(user).stream().map(this::toDTO).toList());
    }

    @PostMapping
    public ResponseEntity<JournalDTO> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateJournalRequest req) {
        Journal j = Journal.builder()
                .user(user)
                .entry(req.entry())
                .mood(req.mood())
                .date(req.date() != null ? req.date() : LocalDate.now())
                .build();
        return ResponseEntity.ok(toDTO(repo.save(j)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {
        Journal j = repo.findByIdAndUser(id, user).orElseThrow(() -> new RuntimeException("Journal not found"));
        repo.delete(j);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    @GetMapping("/mood/stats")
    public ResponseEntity<MoodStatsDTO> moodStats(@AuthenticationPrincipal User user) {
        List<Journal> journals = repo.findByUserOrderByDateDesc(user);
        if (journals.isEmpty()) {
            return ResponseEntity.ok(new MoodStatsDTO(0, null));
        }
        String mostFrequent = journals.stream()
                .filter(j -> j.getMood() != null)
                .collect(Collectors.groupingBy(Journal::getMood, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
        return ResponseEntity.ok(new MoodStatsDTO(journals.size(), mostFrequent));
    }

    private JournalDTO toDTO(Journal j) {
        return new JournalDTO(j.getId(), j.getEntry(), j.getMood(), j.getDate());
    }
}
