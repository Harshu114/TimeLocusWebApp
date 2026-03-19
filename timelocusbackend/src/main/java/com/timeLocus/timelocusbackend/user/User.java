package com.timeLocus.timelocusbackend.user;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private Integer age;
    private String  gender;
    private String  profession;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserType userType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    @Column(nullable = false)
    private boolean enabled = true;

    private String        resetPasswordToken;
    private LocalDateTime resetTokenExpiry;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    // ── Enums ─────────────────────────────────────────────────────────────────
    public enum UserType { student, corporate, self_employed }
    public enum Role     { USER, ADMIN }

    // ── Constructors ──────────────────────────────────────────────────────────
    public User() {}

    // ── Builder ───────────────────────────────────────────────────────────────
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final User u = new User();

        public Builder firstName(String v)  { u.firstName  = v; return this; }
        public Builder lastName(String v)   { u.lastName   = v; return this; }
        public Builder email(String v)      { u.email      = v; return this; }
        public Builder password(String v)   { u.password   = v; return this; }
        public Builder age(Integer v)       { u.age        = v; return this; }
        public Builder gender(String v)     { u.gender     = v; return this; }
        public Builder profession(String v) { u.profession = v; return this; }
        public Builder userType(UserType v) { u.userType   = v; return this; }
        public Builder role(Role v)         { u.role       = v; return this; }
        public Builder enabled(boolean v)   { u.enabled    = v; return this; }

        public User build() { return u; }
    }

    // ── UserDetails ───────────────────────────────────────────────────────────
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public String  getUsername()               { return email; }
    @Override public boolean isAccountNonExpired()       { return true; }
    @Override public boolean isAccountNonLocked()        { return true; }
    @Override public boolean isCredentialsNonExpired()   { return true; }
    @Override public boolean isEnabled()                 { return enabled; }

    @PreUpdate
    void preUpdate() { this.updatedAt = LocalDateTime.now(); }

    // ── Getters / Setters ─────────────────────────────────────────────────────
    public String        getId()                   { return id; }
    public String        getFirstName()            { return firstName; }
    public String        getLastName()             { return lastName; }
    public String        getEmail()                { return email; }
    public String        getPassword()             { return password; }
    public Integer       getAge()                  { return age; }
    public String        getGender()               { return gender; }
    public String        getProfession()           { return profession; }
    public UserType      getUserType()             { return userType; }
    public Role          getRole()                 { return role; }
    public String        getResetPasswordToken()   { return resetPasswordToken; }
    public LocalDateTime getResetTokenExpiry()     { return resetTokenExpiry; }
    public LocalDateTime getCreatedAt()            { return createdAt; }
    public LocalDateTime getUpdatedAt()            { return updatedAt; }

    public void setId(String id)                                   { this.id = id; }
    public void setFirstName(String firstName)                     { this.firstName = firstName; }
    public void setLastName(String lastName)                       { this.lastName = lastName; }
    public void setEmail(String email)                             { this.email = email; }
    public void setPassword(String password)                       { this.password = password; }
    public void setAge(Integer age)                                { this.age = age; }
    public void setGender(String gender)                           { this.gender = gender; }
    public void setProfession(String profession)                   { this.profession = profession; }
    public void setUserType(UserType userType)                     { this.userType = userType; }
    public void setRole(Role role)                                 { this.role = role; }
    public void setEnabled(boolean enabled)                        { this.enabled = enabled; }
    public void setResetPasswordToken(String resetPasswordToken)   { this.resetPasswordToken = resetPasswordToken; }
    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry){ this.resetTokenExpiry = resetTokenExpiry; }
}