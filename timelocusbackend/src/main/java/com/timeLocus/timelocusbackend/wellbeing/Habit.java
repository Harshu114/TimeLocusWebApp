package com.timeLocus.timelocusbackend.wellbeing;

import com.timeLocus.timelocusbackend.user.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "habits")
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int currentStreak = 0;

    @Column(nullable = false)
    private int bestStreak = 0;

    @ElementCollection
    @CollectionTable(name = "habit_completions", joinColumns = @JoinColumn(name = "habit_id"))
    @Column(name = "completion_date")
    private Set<LocalDate> completedDates = new HashSet<>();

    @Column(nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }

    public Habit() {}

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private final Habit h = new Habit();
        public Builder user(User v) { h.user = v; return this; }
        public Builder name(String v) { h.name = v; return this; }
        public Habit build() { return h; }
    }

    public String getId() { return id; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public int getCurrentStreak() { return currentStreak; }
    public int getBestStreak() { return bestStreak; }
    public Set<LocalDate> getCompletedDates() { return completedDates; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setName(String v) { this.name = v; }
    public void setCurrentStreak(int v) { this.currentStreak = v; }
    public void setBestStreak(int v) { this.bestStreak = v; }
    public void setCompletedDates(Set<LocalDate> v) { this.completedDates = v; }
}
