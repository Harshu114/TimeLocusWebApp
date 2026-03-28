package com.timeLocus.timelocusbackend.focus;

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

    public String        getId()              { return id; }
    public User          getUser()            { return user; }
    public String        getMode()            { return mode; }
    public int           getDurationMinutes() { return durationMinutes; }
    public boolean       isCompleted()        { return completed; }
    public LocalDate     getSessionDate()     { return sessionDate; }
    public LocalDateTime getCreatedAt()       { return createdAt; }
}
