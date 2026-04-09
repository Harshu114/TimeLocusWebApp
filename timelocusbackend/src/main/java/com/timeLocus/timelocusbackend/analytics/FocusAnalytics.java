package com.timeLocus.timelocusbackend.analytics;

import com.timeLocus.timelocusbackend.user.User;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "focus_analytics")
public class FocusAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private int totalSessions = 0;

    @Column(nullable = false)
    private int totalMinutes = 0;

    @Column(nullable = false)
    private int longestStreak = 0;

    @Column(nullable = false)
    private int distractionsBlocked = 0;

    // Mode breakdown (stored as JSON)
    @Column(columnDefinition = "TEXT")
    private String modeBreakdown; // {"pomodoro": 3, "deep": 1, "sprint": 2}

    // Hourly distribution (stored as JSON)
    @Column(columnDefinition = "TEXT")
    private String hourlyDistribution; // {"9": 2, "10": 1, "14": 3}

    // Task breakdown (stored as JSON)
    @Column(columnDefinition = "TEXT")
    private String taskBreakdown; // {"task1": 45, "task2": 30}

    // Productivity score (0-100)
    @Column(nullable = false)
    private int productivityScore = 0;

    @Column(nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(nullable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null) this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public FocusAnalytics() {}

    public FocusAnalytics(User user, LocalDate date) {
        this.user = user;
        this.date = date;
    }

    // Getters and Setters
    public String getId() { return id; }
    public User getUser() { return user; }
    public LocalDate getDate() { return date; }
    public int getTotalSessions() { return totalSessions; }
    public int getTotalMinutes() { return totalMinutes; }
    public int getLongestStreak() { return longestStreak; }
    public int getDistractionsBlocked() { return distractionsBlocked; }
    public String getModeBreakdown() { return modeBreakdown; }
    public String getHourlyDistribution() { return hourlyDistribution; }
    public String getTaskBreakdown() { return taskBreakdown; }
    public int getProductivityScore() { return productivityScore; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setUser(User user) { this.user = user; }
    public void setDate(LocalDate date) { this.date = date; }
    public void setTotalSessions(int sessions) { this.totalSessions = sessions; }
    public void setTotalMinutes(int minutes) { this.totalMinutes = minutes; }
    public void setLongestStreak(int streak) { this.longestStreak = streak; }
    public void setDistractionsBlocked(int blocked) { this.distractionsBlocked = blocked; }
    public void setModeBreakdown(String breakdown) { this.modeBreakdown = breakdown; }
    public void setHourlyDistribution(String distribution) { this.hourlyDistribution = distribution; }
    public void setTaskBreakdown(String breakdown) { this.taskBreakdown = breakdown; }
    public void setProductivityScore(int score) { this.productivityScore = score; }
}
