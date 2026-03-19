package com.timeLocus.timelocusbackend.planner;

import com.timeLocus.timelocusbackend.user.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "planner_events")
public class PlannerEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private LocalDate eventDate;

    private LocalTime eventTime;

    private String eventType; // work, meeting, deadline, personal, exam

    @Column(nullable = false)
    private boolean done = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Constructors ──────────────────────────────────────────────────────────
    public PlannerEvent() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final PlannerEvent e = new PlannerEvent();
        public Builder user(User v)          { e.user      = v; return this; }
        public Builder title(String v)       { e.title     = v; return this; }
        public Builder description(String v) { e.description = v; return this; }
        public Builder eventDate(LocalDate v){ e.eventDate = v; return this; }
        public Builder eventTime(LocalTime v){ e.eventTime = v; return this; }
        public Builder eventType(String v)   { e.eventType = v; return this; }
        public PlannerEvent build() { return e; }
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────
    public String        getId()          { return id; }
    public User          getUser()        { return user; }
    public String        getTitle()       { return title; }
    public String        getDescription() { return description; }
    public LocalDate     getEventDate()   { return eventDate; }
    public LocalTime     getEventTime()   { return eventTime; }
    public String        getEventType()   { return eventType; }
    public boolean       isDone()         { return done; }
    public LocalDateTime getCreatedAt()   { return createdAt; }

    public void setTitle(String v)       { this.title     = v; }
    public void setDescription(String v) { this.description = v; }
    public void setEventDate(LocalDate v){ this.eventDate = v; }
    public void setEventTime(LocalTime v){ this.eventTime = v; }
    public void setEventType(String v)   { this.eventType = v; }
    public void setDone(boolean v)       { this.done      = v; }
}
