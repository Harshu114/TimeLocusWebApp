package com.timeLocus.timelocusbackend.timetracker;

import com.timeLocus.timelocusbackend.timetracker.dto.*;
import com.timeLocus.timelocusbackend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

// @Service — this is the BRAIN of the time tracking feature.
// The controller only handles HTTP. This class handles all the logic.
@Service
public class TimeTrackerService {

    private final TimeEntryRepository repo;

    public TimeTrackerService(TimeEntryRepository repo) {
        this.repo = repo;
    }

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ── Get entries for a specific date ───────────────────────────────────────
    public List<TimeEntryDTO> getEntriesForDate(User user, LocalDate date) {
        return repo.findByUserAndDateOrderByStartTimeAsc(user, date)
                   .stream().map(this::toDTO).toList();
    }

    // ── Get entries in a date range ───────────────────────────────────────────
    public List<TimeEntryDTO> getEntriesInRange(User user, LocalDate from, LocalDate to) {
        return repo.findByUserAndDateBetweenOrderByDateAscStartTimeAsc(user, from, to)
                   .stream().map(this::toDTO).toList();
    }

    // ── Daily summary — total time, focus score, breakdown ───────────────────
    public DailySummaryDTO getDailySummary(User user, LocalDate date) {
        List<TimeEntry> entries = repo.findByUserAndDateOrderByStartTimeAsc(user, date);

        int total = entries.stream()
                .mapToInt(e -> e.getDuration() != null ? e.getDuration() : 0)
                .sum();

        // Group by category and sum durations
        Map<String, Integer> byCategory = entries.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory() != null ? e.getCategory() : "other",
                        Collectors.summingInt(e -> e.getDuration() != null ? e.getDuration() : 0)
                ));

        // Convert map to list of CategoryBreakdown with percentage
        List<CategoryBreakdown> breakdown = byCategory.entrySet().stream()
                .map(entry -> new CategoryBreakdown(
                        entry.getKey(),
                        entry.getValue(),
                        total > 0 ? (double) entry.getValue() / total * 100 : 0
                )).toList();

        return new DailySummaryDTO(
                date.format(DATE_FMT),
                total,
                calculateFocusScore(entries, total),
                entries.size(),
                breakdown
        );
    }

    // ── Weekly summary — one DailySummaryDTO per day Mon-Sun ─────────────────
    public List<DailySummaryDTO> getWeeklySummary(User user) {
        LocalDate monday = LocalDate.now().with(DayOfWeek.MONDAY);
        List<DailySummaryDTO> result = new ArrayList<>();
        for (LocalDate d = monday; !d.isAfter(monday.plusDays(6)); d = d.plusDays(1)) {
            result.add(getDailySummary(user, d));
        }
        return result;
    }

    // ── Create manual time entry ──────────────────────────────────────────────
    @Transactional
    public TimeEntryDTO createEntry(User user, CreateEntryRequest req) {
        LocalDate date  = req.date()      != null ? LocalDate.parse(req.date(), DATE_FMT)      : LocalDate.now();
        LocalTime start = req.startTime() != null ? LocalTime.parse(req.startTime(), TIME_FMT) : null;
        LocalTime end   = req.endTime()   != null ? LocalTime.parse(req.endTime(), TIME_FMT)   : null;

        Integer duration = req.duration();
        if (duration == null && start != null && end != null) {
            duration = (int) Duration.between(start, end).toMinutes();
        }

        TimeEntry entry = TimeEntry.builder()
                .user(user).task(req.task()).date(date)
                .startTime(start).endTime(end).duration(duration)
                .category(req.category()).notes(req.notes())
                .manual(true)
                .build();
        return toDTO(repo.save(entry));
    }

    // ── Start live timer — saves entry with only startTime ───────────────────
    @Transactional
    public TimeEntryDTO startTimer(User user, String task, String category) {
        TimeEntry entry = TimeEntry.builder()
                .user(user)
                .task(task)
                .date(LocalDate.now())
                .startTime(LocalTime.now().withSecond(0).withNano(0))
                .category(category != null ? category : "work")
                .manual(false)
                .build();
        return toDTO(repo.save(entry));
    }

    // ── Stop live timer — fills endTime and calculates duration ──────────────
    @Transactional
    public TimeEntryDTO stopTimer(User user, String id) {
        TimeEntry entry = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
        LocalTime now = LocalTime.now().withSecond(0).withNano(0);
        entry.setEndTime(now);
        if (entry.getStartTime() != null) {
            entry.setDuration((int) Duration.between(entry.getStartTime(), now).toMinutes());
        }
        return toDTO(repo.save(entry));
    }

    // ── Update an existing entry ──────────────────────────────────────────────
    @Transactional
    public TimeEntryDTO updateEntry(User user, String id, CreateEntryRequest req) {
        TimeEntry entry = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
        if (req.task()      != null) entry.setTask(req.task());
        if (req.category()  != null) entry.setCategory(req.category());
        if (req.notes()     != null) entry.setNotes(req.notes());
        if (req.startTime() != null) entry.setStartTime(LocalTime.parse(req.startTime(), TIME_FMT));
        if (req.endTime()   != null) entry.setEndTime(LocalTime.parse(req.endTime(), TIME_FMT));
        if (req.duration()  != null) entry.setDuration(req.duration());
        return toDTO(repo.save(entry));
    }

    // ── Delete an entry ───────────────────────────────────────────────────────
    @Transactional
    public void deleteEntry(User user, String id) {
        TimeEntry entry = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
        repo.delete(entry);
    }

    // ── Focus score algorithm ─────────────────────────────────────────────────
    // Score 0-100 based on:
    //   - Deep work ratio (work + study) → up to 70 points
    //   - Healthy break ratio (10-20%) → up to 20 points
    //   - Task switching penalty (>8 switches → -2 per extra switch)
    private double calculateFocusScore(List<TimeEntry> entries, int totalMinutes) {
        if (entries.isEmpty() || totalMinutes == 0) return 0;

        int deepWorkMin = entries.stream()
                .filter(e -> List.of("work", "study").contains(e.getCategory()))
                .mapToInt(e -> e.getDuration() != null ? e.getDuration() : 0)
                .sum();

        int breakMin = entries.stream()
                .filter(e -> "break".equals(e.getCategory()))
                .mapToInt(e -> e.getDuration() != null ? e.getDuration() : 0)
                .sum();

        double deepRatio  = (double) deepWorkMin / totalMinutes;
        double breakRatio = (double) breakMin / totalMinutes;
        int    switches   = entries.size() - 1;

        double score = (deepRatio * 70)
                + (breakRatio >= 0.1 && breakRatio <= 0.2 ? 20 : 10)
                - (switches > 8 ? (switches - 8) * 2.0 : 0);

        return Math.max(0, Math.min(100, score));
    }

    // ── Entity → DTO ──────────────────────────────────────────────────────────
    private TimeEntryDTO toDTO(TimeEntry e) {
        return new TimeEntryDTO(
                e.getId(), e.getTask(),
                e.getDate()      != null ? e.getDate().format(DATE_FMT)      : null,
                e.getStartTime() != null ? e.getStartTime().format(TIME_FMT) : null,
                e.getEndTime()   != null ? e.getEndTime().format(TIME_FMT)   : null,
                e.getDuration(), e.getCategory(), e.getNotes(), e.isManual()
        );
    }
}
