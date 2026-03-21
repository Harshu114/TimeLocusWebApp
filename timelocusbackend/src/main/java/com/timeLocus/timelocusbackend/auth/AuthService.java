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

// @Service — marks this as a Spring-managed service bean.
// Contains ALL business logic for authentication.
// The controller calls these methods — it does not know HOW they work.
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

    // ── Check if user exists ──────────────────────────────────────────────────
    public CheckUserResponse checkUser(String identifier) {
        return userRepository.findByEmail(identifier.toLowerCase().trim())
                .map(u  -> new CheckUserResponse(true, u.getFirstName()))
                .orElse(new CheckUserResponse(false, null));
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest req) {
        // authManager.authenticate() does the password check.
        // It calls UserDetailsServiceImpl.loadUserByUsername() internally.
        // Throws BadCredentialsException if password is wrong → caught by GlobalExceptionHandler.
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.email().toLowerCase(), req.password())
        );
        User user = userRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return buildAuthResponse(user);
    }

    // ── Register ──────────────────────────────────────────────────────────────
    @Transactional // If anything fails, database changes are rolled back
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email().toLowerCase())) {
            throw new IllegalArgumentException("Email already registered.");
        }
        User user = User.builder()
                .firstName(req.firstName().trim())
                .lastName(req.lastName().trim())
                .email(req.email().toLowerCase().trim())
                .password(passwordEncoder.encode(req.password())) // BCrypt hash
                .age(req.age())
                .gender(req.gender())
                .profession(req.profession())
                .userType(req.userType())
                .build();
        userRepository.save(user);
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
            msg.setText("Reset link: http://localhost:3000/reset-password?token=" + token
                    + "\n\nExpires in 1 hour.");
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

    // ── Private helper: build the auth response ───────────────────────────────
    private AuthResponse buildAuthResponse(User user) {
        String token        = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        UserResponse userResp = new UserResponse(
                user.getId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getUserType().name()
        );
        return new AuthResponse(token, refreshToken, userResp);
    }
}
