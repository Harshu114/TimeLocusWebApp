package com.timeLocus.timelocusbackend.integration.calendar;

import com.timeLocus.timelocusbackend.user.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_integrations")
public class CalendarIntegration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String provider = "google"; // google, outlook, apple

    @Column(nullable = false)
    private boolean connected = false;

    // OAuth tokens (encrypted at rest)
    @Column(columnDefinition = "TEXT")
    private String accessToken;

    @Column(columnDefinition = "TEXT")
    private String refreshToken;

    @Column(nullable = true)
    private LocalDateTime tokenExpiry;

    // Calendar IDs for sync
    @Column(columnDefinition = "TEXT")
    private String calendarIds; // JSON array of calendar IDs

    // Sync settings
    @Column(nullable = false)
    private boolean autoScheduleEnabled = false;

    @Column(nullable = false)
    private boolean syncToCalendarEnabled = false;

    @Column(nullable = true)
    private String defaultCalendarId;

    // Working hours for auto-scheduling
    @Column(nullable = true)
    private Integer workStartHour; // 9 = 9 AM

    @Column(nullable = true)
    private Integer workEndHour; // 17 = 5 PM

    @Column(nullable = true)
    private String workDays; // JSON array: ["MON", "TUE", "WED", "THU", "FRI"]

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

    public CalendarIntegration() {}

    public CalendarIntegration(User user, String provider) {
        this.user = user;
        this.provider = provider;
    }

    // Getters and Setters
    public String getId() { return id; }
    public User getUser() { return user; }
    public String getProvider() { return provider; }
    public boolean isConnected() { return connected; }
    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public LocalDateTime getTokenExpiry() { return tokenExpiry; }
    public String getCalendarIds() { return calendarIds; }
    public boolean isAutoScheduleEnabled() { return autoScheduleEnabled; }
    public boolean isSyncToCalendarEnabled() { return syncToCalendarEnabled; }
    public String getDefaultCalendarId() { return defaultCalendarId; }
    public Integer getWorkStartHour() { return workStartHour; }
    public Integer getWorkEndHour() { return workEndHour; }
    public String getWorkDays() { return workDays; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setUser(User user) { this.user = user; }
    public void setConnected(boolean connected) { this.connected = connected; }
    public void setAccessToken(String token) { this.accessToken = token; }
    public void setRefreshToken(String token) { this.refreshToken = token; }
    public void setTokenExpiry(LocalDateTime expiry) { this.tokenExpiry = expiry; }
    public void setCalendarIds(String ids) { this.calendarIds = ids; }
    public void setAutoScheduleEnabled(boolean enabled) { this.autoScheduleEnabled = enabled; }
    public void setSyncToCalendarEnabled(boolean enabled) { this.syncToCalendarEnabled = enabled; }
    public void setDefaultCalendarId(String id) { this.defaultCalendarId = id; }
    public void setWorkStartHour(Integer hour) { this.workStartHour = hour; }
    public void setWorkEndHour(Integer hour) { this.workEndHour = hour; }
    public void setWorkDays(String days) { this.workDays = days; }
}
