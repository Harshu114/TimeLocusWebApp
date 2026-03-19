package com.timeLocus.timelocusbackend.auth;

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
    public AuthController.CheckUserResponse checkUser(String identifier) {
        var user = userRepository.findByEmail(identifier.toLowerCase().trim()).orElse(null);
        if (user == null) return new AuthController.CheckUserResponse(false, null);
        return new AuthController.CheckUserResponse(true, user.getFirstName());
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public AuthController.AuthResponse login(AuthController.LoginRequest req) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email().toLowerCase(), req.password())
        );
        User user = userRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return buildAuthResponse(user);
    }

    // ── Register ──────────────────────────────────────────────────────────────
    @Transactional
    public AuthController.AuthResponse register(AuthController.RegisterRequest req) {
        if (userRepository.existsByEmail(req.email().toLowerCase())) {
            throw new IllegalArgumentException("Email already registered.");
        }
        User user = User.builder()
                .firstName(req.firstName().trim())
                .lastName(req.lastName().trim())
                .email(req.email().toLowerCase().trim())
                .password(passwordEncoder.encode(req.password()))
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
        var userOpt = userRepository.findByEmail(email.toLowerCase().trim());
        if (userOpt.isEmpty()) return;

        User user  = userOpt.get();
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
    }

    // ── Reset password ────────────────────────────────────────────────────────
    @Transactional
    public void resetPassword(AuthController.ResetPasswordRequest req) {
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
    public AuthController.AuthResponse refreshToken(String refreshToken) {
        String email = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new IllegalArgumentException("Invalid refresh token.");
        }
        return buildAuthResponse(user);
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private AuthController.AuthResponse buildAuthResponse(User user) {
        String token        = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        AuthController.UserResponse userResp = new AuthController.UserResponse(
                user.getId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getUserType().name()
        );
        return new AuthController.AuthResponse(token, refreshToken, userResp);
    }
}