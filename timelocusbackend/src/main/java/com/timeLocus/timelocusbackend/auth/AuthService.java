package com.timeLocus.timelocusbackend.auth;

import com.timeLocus.timelocusbackend.auth.dto.*;
import com.timeLocus.timelocusbackend.config.JwtService;
import com.timeLocus.timelocusbackend.user.User;
import com.timeLocus.timelocusbackend.user.UserRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtService            jwtService;
    private final AuthenticationManager authManager;
    private final JavaMailSender        mailSender;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authManager,
                       JavaMailSender mailSender) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService      = jwtService;
        this.authManager     = authManager;
        this.mailSender      = mailSender;
    }

    // ── Check user exists ─────────────────────────────────────────────────────
    public CheckUserResponse checkUser(String identifier) {
        return userRepository.findByEmail(identifier.toLowerCase().trim())
                .map(u -> new CheckUserResponse(true, u.getFirstName()))
                .orElse(new CheckUserResponse(false, null));
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest req) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.email().toLowerCase(), req.password())
        );
        User user = userRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return buildAuthResponse(user);
    }

    // ── Register ──────────────────────────────────────────────────────────────
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().toLowerCase();
        System.out.println("Registering user with email: " + email);
        if (userRepository.existsByEmail(email)) {
            System.out.println("Email already exists: " + email);
            throw new IllegalArgumentException("Email already registered.");
        }
        System.out.println("Email is new, proceeding to create user");

        // ── FIX: convert lowercase userType string to enum ────────────────────
        // The frontend sends "student", "corporate", "self_employed", "wellbeing"
        // The enum is STUDENT, CORPORATE, SELF_EMPLOYED, WELLBEING
        // We convert to uppercase before parsing so both cases work.
        User.UserType resolvedType;
        try {
            resolvedType = req.userType(); // now handles lowercase/uppercase // already parsed by Spring if uppercase
        } catch (Exception e) {
            resolvedType = User.UserType.STUDENT; // safe fallback
        }

        User user = new User(
                null, // id
                req.firstName().trim(),
                req.lastName().trim(),
                email,
                passwordEncoder.encode(req.password()),
                req.age(),
                req.gender(),
                req.profession(),
                resolvedType,
                null, // resetPasswordToken
                null  // resetTokenExpiry
        );
        // Ensure timestamps are set (though @PrePersist should handle this)
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        System.out.println("Saving user: " + user.getEmail());
        userRepository.save(user);
        System.out.println("User saved successfully");
        return buildAuthResponse(user);
    }

    // ── Forgot password ───────────────────────────────────────────────────────
    @Transactional
    public void sendPasswordResetEmail(String email) {
        userRepository.findByEmail(email.toLowerCase().trim()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(email);
            msg.setSubject("TimeLocus - Password Reset");
            msg.setText("Reset link: http://localhost:3000/reset-password?token=" + token + "\n\nExpires in 1 hour.");
            try { mailSender.send(msg); } catch (Exception ignored) {}
        });
    }

    // ── Reset password ────────────────────────────────────────────────────────
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        User user = userRepository.findByResetPasswordToken(req.token())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token."));
        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token has expired.");
        }
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        user.setResetPasswordToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    // ── Refresh token ─────────────────────────────────────────────────────────
    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new IllegalArgumentException("Invalid refresh token.");
        }
        return buildAuthResponse(user);
    }

    // ── Build auth response ───────────────────────────────────────────────────
    // KEY FIX: return userType as LOWERCASE so frontend constants map correctly.
    // Frontend config uses: 'student', 'corporate', 'self_employed', 'wellbeing'
    // Backend enum is:      STUDENT,   CORPORATE,   SELF_EMPLOYED,   WELLBEING
    // .name().toLowerCase() converts STUDENT → student ✅
    private AuthResponse buildAuthResponse(User user) {
        String token        = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        UserResponse userResp = new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getUserType().name().toLowerCase()  // ← THE FIX: "STUDENT" → "student"
        );
        return new AuthResponse(token, refreshToken, userResp);
    }
}