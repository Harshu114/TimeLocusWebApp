package com.timeLocus.timelocusbackend.focus;

import com.timeLocus.timelocusbackend.user.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "distraction_blocks")
public class DistractionBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = true)
    private FocusSession session;

    @Column(nullable = false)
    private String domain;

    @Column(nullable = false)
    private String type = "website"; // website, app, notification

    @Column(nullable = false)
    private boolean blocked = true;

    @Column(nullable = true)
    private LocalTime blockedAt;

    @Column(nullable = true, length = 500)
    private String reason;

    @Column(nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }

    public DistractionBlock() {}

    public DistractionBlock(User user, String domain, String type) {
        this.user = user;
        this.domain = domain;
        this.type = type;
    }

    public DistractionBlock(User user, FocusSession session, String domain) {
        this.user = user;
        this.session = session;
        this.domain = domain;
    }

    // Getters and Setters
    public String getId() { return id; }
    public User getUser() { return user; }
    public FocusSession getSession() { return session; }
    public String getDomain() { return domain; }
    public String getType() { return type; }
    public boolean isBlocked() { return blocked; }
    public LocalTime getBlockedAt() { return blockedAt; }
    public String getReason() { return reason; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setUser(User user) { this.user = user; }
    public void setSession(FocusSession session) { this.session = session; }
    public void setDomain(String domain) { this.domain = domain; }
    public void setType(String type) { this.type = type; }
    public void setBlocked(boolean blocked) { this.blocked = blocked; }
    public void setBlockedAt(LocalTime time) { this.blockedAt = time; }
    public void setReason(String reason) { this.reason = reason; }
}
