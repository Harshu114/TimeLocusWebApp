package com.timeLocus.timelocusbackend.task;

import com.timeLocus.timelocusbackend.user.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private boolean done = false;

    @Column(nullable = false)
    private String priority = "medium"; // high, medium, low

    private LocalDate dueDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public Task() {}

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private final Task t = new Task();
        public Builder user(User v)       { t.user     = v; return this; }
        public Builder title(String v)    { t.title    = v; return this; }
        public Builder priority(String v) { t.priority = v; return this; }
        public Builder dueDate(LocalDate v){ t.dueDate = v; return this; }
        public Task build() { return t; }
    }

    @PreUpdate void onUpdate() { this.setUpdatedAt(LocalDateTime.now()); }

    public String    getId()       { return id; }
    public User      getUser()     { return user; }
    public String    getTitle()    { return title; }
    public boolean   isDone()      { return done; }
    public String    getPriority() { return priority; }
    public LocalDate getDueDate()  { return dueDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setTitle(String v)    { this.title    = v; }
    public void setDone(boolean v)    { this.done     = v; }
    public void setPriority(String v) { this.priority = v; }
    public void setDueDate(LocalDate v){ this.dueDate = v; }

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}
}
