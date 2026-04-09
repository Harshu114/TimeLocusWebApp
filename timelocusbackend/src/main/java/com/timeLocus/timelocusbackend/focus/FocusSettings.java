package com.timeLocus.timelocusbackend.focus;

import com.timeLocus.timelocusbackend.user.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "focus_settings")
public class FocusSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Pomodoro mode settings (in minutes)
    @Column(nullable = false)
    private int pomodoroFocus = 25;

    @Column(nullable = false)
    private int pomodoroBreak = 5;

    @Column(nullable = false)
    private int pomodoroLongBreak = 15;

    // Deep work mode settings
    @Column(nullable = false)
    private int deepFocus = 90;

    @Column(nullable = false)
    private int deepBreak = 20;

    @Column(nullable = false)
    private int deepLongBreak = 30;

    // Sprint mode settings
    @Column(nullable = false)
    private int sprintFocus = 15;

    @Column(nullable = false)
    private int sprintBreak = 3;

    @Column(nullable = false)
    private int sprintLongBreak = 10;

    // General settings
    @Column(nullable = false)
    private int longBreakInterval = 4; // sessions before long break

    @Column(nullable = false)
    private boolean autoStartBreak = false;

    @Column(nullable = false)
    private boolean autoStartFocus = false;

    // Sound settings
    @Column(nullable = false)
    private String soundPreset = "digital";

    @Column(nullable = false)
    private boolean notificationsEnabled = true;

    // Distraction blocklist (JSON array of domains)
    @Column(columnDefinition = "TEXT")
    private String distractionBlocklist;

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

    public FocusSettings() {}

    public FocusSettings(User user) {
        this.user = user;
    }

    // Getters and Setters
    public String getId() { return id; }
    public User getUser() { return user; }

    public int getPomodoroFocus() { return pomodoroFocus; }
    public int getPomodoroBreak() { return pomodoroBreak; }
    public int getPomodoroLongBreak() { return pomodoroLongBreak; }

    public int getDeepFocus() { return deepFocus; }
    public int getDeepBreak() { return deepBreak; }
    public int getDeepLongBreak() { return deepLongBreak; }

    public int getSprintFocus() { return sprintFocus; }
    public int getSprintBreak() { return sprintBreak; }
    public int getSprintLongBreak() { return sprintLongBreak; }

    public int getLongBreakInterval() { return longBreakInterval; }
    public boolean isAutoStartBreak() { return autoStartBreak; }
    public boolean isAutoStartFocus() { return autoStartFocus; }
    public String getSoundPreset() { return soundPreset; }
    public boolean isNotificationsEnabled() { return notificationsEnabled; }
    public String getDistractionBlocklist() { return distractionBlocklist; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setPomodoroFocus(int pomodoroFocus) { this.pomodoroFocus = pomodoroFocus; }
    public void setPomodoroBreak(int pomodoroBreak) { this.pomodoroBreak = pomodoroBreak; }
    public void setPomodoroLongBreak(int pomodoroLongBreak) { this.pomodoroLongBreak = pomodoroLongBreak; }

    public void setDeepFocus(int deepFocus) { this.deepFocus = deepFocus; }
    public void setDeepBreak(int deepBreak) { this.deepBreak = deepBreak; }
    public void setDeepLongBreak(int deepLongBreak) { this.deepLongBreak = deepLongBreak; }

    public void setSprintFocus(int sprintFocus) { this.sprintFocus = sprintFocus; }
    public void setSprintBreak(int sprintBreak) { this.sprintBreak = sprintBreak; }
    public void setSprintLongBreak(int sprintLongBreak) { this.sprintLongBreak = sprintLongBreak; }

    public void setLongBreakInterval(int interval) { this.longBreakInterval = interval; }
    public void setAutoStartBreak(boolean auto) { this.autoStartBreak = auto; }
    public void setAutoStartFocus(boolean auto) { this.autoStartFocus = auto; }
    public void setSoundPreset(String preset) { this.soundPreset = preset; }
    public void setNotificationsEnabled(boolean enabled) { this.notificationsEnabled = enabled; }
    public void setDistractionBlocklist(String blocklist) { this.distractionBlocklist = blocklist; }
    public void setUser(User user) { this.user = user; }
}
