package com.timeLocus.timelocusbackend.wellbeing;

import com.timeLocus.timelocusbackend.user.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "journals")
public class Journal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String entry;

    private String mood;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }

    public Journal() {}

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private final Journal j = new Journal();
        public Builder user(User v) { j.user = v; return this; }
        public Builder entry(String v) { j.entry = v; return this; }
        public Builder mood(String v) { j.mood = v; return this; }
        public Builder date(LocalDate v) { j.date = v; return this; }
        public Journal build() { return j; }
    }

    public String getId() { return id; }
    public User getUser() { return user; }
    public String getEntry() { return entry; }
    public String getMood() { return mood; }
    public LocalDate getDate() { return date; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setEntry(String v) { this.entry = v; }
    public void setMood(String v) { this.mood = v; }
    public void setDate(LocalDate v) { this.date = v; }
}
