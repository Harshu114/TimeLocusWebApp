package com.timeLocus.timelocusbackend.focus;

import java.time.LocalTime; // Add this line
import jakarta.persistence.Entity;
import com.timeLocus.timelocusbackend.user.User;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "focus_sessions")
public class FocusSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String mode = "pomodoro";

    @Column(nullable = false)
    private int durationMinutes;

    @Column(nullable = false)
    private boolean completed = true;

    @Column(nullable = false)
    private LocalDate sessionDate = LocalDate.now();

    @Column(nullable = true)
    private String linkedTaskId;

    @Column(nullable = true)
    private LocalTime startTime;

    @Column(nullable = true)
    private LocalTime endTime;

    @Column(nullable = false)
    private boolean interrupted = false;

    @Column(nullable = false)
    private int interruptionCount = 0;

    @Column(nullable = true, length = 1000)
    private String notes;

    // Enhanced features fields
    @Column(nullable = false)
    private int distractionsBlocked = 0;

    @Column(nullable = true)
    private String calendarEventId;

    @Column(nullable = true)
    private String deviceId;

    @Column(columnDefinition = "TEXT")
    private String gamificationData;

    @Column(columnDefinition = "TEXT")
    private String interruptions;

    @Column(nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }

    public FocusSession() {}

    public FocusSession(User user, String mode, int durationMinutes) {
        this.user = user;
        this.mode = mode;
        this.durationMinutes = durationMinutes;
    }

    public FocusSession(User user, String mode, int durationMinutes, String linkedTaskId) {
        this.user = user;
        this.mode = mode;
        this.durationMinutes = durationMinutes;
        this.linkedTaskId = linkedTaskId;
    }

    public String        getId()                 { return id; }
    public User          getUser()               { return user; }
    public String        getMode()               { return mode; }
    public int           getDurationMinutes()    { return durationMinutes; }
    public boolean       isCompleted()           { return completed; }
    public LocalDate     getSessionDate()        { return sessionDate; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
    public String        getLinkedTaskId()       { return linkedTaskId; }
    public LocalTime     getStartTime()          { return startTime; }
    public LocalTime     getEndTime()            { return endTime; }
    public boolean       isInterrupted()         { return interrupted; }
    public int           getInterruptionCount()  { return interruptionCount; }
    public String        getNotes()              { return notes; }

    public void setCompleted(boolean completed)           { this.completed = completed; }
    public void setStartTime(LocalTime startTime)         { this.startTime = startTime; }
    public void setEndTime(LocalTime endTime)             { this.endTime = endTime; }
    public void setInterrupted(boolean interrupted)       { this.interrupted = interrupted; }
    public void setInterruptionCount(int count)           { this.interruptionCount = count; }
    public void setNotes(String notes)                    { this.notes = notes; }
    public void setMode(String mode)                      { this.mode = mode; }

    // Enhanced features getters/setters
    public int       getDistractionsBlocked()    { return distractionsBlocked; }
    public String    getCalendarEventId()        { return calendarEventId; }
    public String    getDeviceId()               { return deviceId; }
    public String    getGamificationData()       { return gamificationData; }
    public String    getInterruptions()          { return interruptions; }

    public void setDistractionsBlocked(int count) { this.distractionsBlocked = count; }
    public void setCalendarEventId(String id)     { this.calendarEventId = id; }
    public void setDeviceId(String deviceId)      { this.deviceId = deviceId; }
    public void setGamificationData(String data)  { this.gamificationData = data; }
    public void setInterruptions(String data)     { this.interruptions = data; }
}
