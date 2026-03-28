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

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate eventDate;

    private LocalTime eventTime;

    private String eventType;

    @Column(nullable = false)
    private boolean done = false;

    // ── New rich fields ────────────────────────────────────────────────────────

    private String priority;   // low | medium | high | critical

    @Column(columnDefinition = "TEXT")
    private String notes;

    // Subtasks stored as JSON string: [{"id":"...","text":"...","done":false,"estimatedMins":30}]
    @Column(columnDefinition = "TEXT")
    private String subtasksJson;

    // Tags stored as JSON string: ["tag1","tag2"]
    @Column(columnDefinition = "TEXT")
    private String tagsJson;

    private Integer estimatedMins;

    private boolean aiGenerated = false;

    @Column(nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }

    public PlannerEvent() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final PlannerEvent e = new PlannerEvent();
        public Builder user(User v)           { e.user          = v; return this; }
        public Builder title(String v)        { e.title         = v; return this; }
        public Builder description(String v)  { e.description   = v; return this; }
        public Builder eventDate(LocalDate v) { e.eventDate     = v; return this; }
        public Builder eventTime(LocalTime v) { e.eventTime     = v; return this; }
        public Builder eventType(String v)    { e.eventType     = v; return this; }
        public Builder priority(String v)     { e.priority      = v; return this; }
        public Builder notes(String v)        { e.notes         = v; return this; }
        public Builder subtasksJson(String v) { e.subtasksJson  = v; return this; }
        public Builder tagsJson(String v)     { e.tagsJson      = v; return this; }
        public Builder estimatedMins(Integer v){ e.estimatedMins= v; return this; }
        public Builder aiGenerated(boolean v) { e.aiGenerated   = v; return this; }
        public PlannerEvent build() { return e; }
    }

    // ── Getters ────────────────────────────────────────────────────────────────
    public String        getId()            { return id; }
    public User          getUser()          { return user; }
    public String        getTitle()         { return title; }
    public String        getDescription()   { return description; }
    public LocalDate     getEventDate()     { return eventDate; }
    public LocalTime     getEventTime()     { return eventTime; }
    public String        getEventType()     { return eventType; }
    public boolean       isDone()           { return done; }
    public String        getPriority()      { return priority; }
    public String        getNotes()         { return notes; }
    public String        getSubtasksJson()  { return subtasksJson; }
    public String        getTagsJson()      { return tagsJson; }
    public Integer       getEstimatedMins() { return estimatedMins; }
    public boolean       isAiGenerated()    { return aiGenerated; }
    public LocalDateTime getCreatedAt()     { return createdAt; }

    // ── Setters ────────────────────────────────────────────────────────────────
    public void setTitle(String v)          { this.title         = v; }
    public void setDescription(String v)    { this.description   = v; }
    public void setEventDate(LocalDate v)   { this.eventDate     = v; }
    public void setEventTime(LocalTime v)   { this.eventTime     = v; }
    public void setEventType(String v)      { this.eventType     = v; }
    public void setDone(boolean v)          { this.done          = v; }
    public void setPriority(String v)       { this.priority      = v; }
    public void setNotes(String v)          { this.notes         = v; }
    public void setSubtasksJson(String v)   { this.subtasksJson  = v; }
    public void setTagsJson(String v)       { this.tagsJson      = v; }
    public void setEstimatedMins(Integer v) { this.estimatedMins = v; }
    public void setAiGenerated(boolean v)   { this.aiGenerated   = v; }
}