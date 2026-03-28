package com.timeLocus.timelocusbackend.timetracker;

import com.timeLocus.timelocusbackend.user.User;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "time_entries")
public class TimeEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String task;

    @Column(nullable = false)
    private LocalDate date;

    private LocalTime startTime;
    private LocalTime endTime;

    private Integer duration;

    private String category;
    private String notes;

    @Column(nullable = false)
    private boolean manual = false;

    @Column(nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }

    public TimeEntry() {}

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final TimeEntry e = new TimeEntry();

        public Builder user(User v)          { e.user      = v; return this; }
        public Builder task(String v)        { e.task      = v; return this; }
        public Builder date(LocalDate v)     { e.date      = v; return this; }
        public Builder startTime(LocalTime v){ e.startTime = v; return this; }
        public Builder endTime(LocalTime v)  { e.endTime   = v; return this; }
        public Builder duration(Integer v)   { e.duration  = v; return this; }
        public Builder category(String v)    { e.category  = v; return this; }
        public Builder notes(String v)       { e.notes     = v; return this; }
        public Builder manual(boolean v)     { e.manual    = v; return this; }

        public TimeEntry build() { return e; }
    }

    public String        getId()        { return id; }
    public User          getUser()      { return user; }
    public String        getTask()      { return task; }
    public LocalDate     getDate()      { return date; }
    public LocalTime     getStartTime() { return startTime; }
    public LocalTime     getEndTime()   { return endTime; }
    public Integer       getDuration()  { return duration; }
    public String        getCategory()  { return category; }
    public String        getNotes()     { return notes; }
    public boolean       isManual()     { return manual; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(String id)               { this.id        = id; }
    public void setUser(User user)             { this.user      = user; }
    public void setTask(String task)           { this.task      = task; }
    public void setDate(LocalDate date)        { this.date      = date; }
    public void setStartTime(LocalTime t)      { this.startTime = t; }
    public void setEndTime(LocalTime t)        { this.endTime   = t; }
    public void setDuration(Integer duration)  { this.duration  = duration; }
    public void setCategory(String category)   { this.category  = category; }
    public void setNotes(String notes)         { this.notes     = notes; }
    public void setManual(boolean manual)      { this.manual    = manual; }
}
