package com.timeLocus.timelocusbackend.auth;

import com.timeLocus.timelocusbackend.auth.dto.*;
import com.timeLocus.timelocusbackend.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// @RestController — handles HTTP requests, returns JSON automatically.
// @RequestMapping — all endpoints in this class start with /auth.
// This controller is THIN — it only:
//   1. Receives the HTTP request
//   2. Calls AuthService
//   3. Returns the response
// NO business logic here.
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    // Constructor injection — Spring injects AuthService automatically.
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // GET /auth/check-user?identifier=email@test.com
    // Called by login page to check if email exists before showing password field.
    @GetMapping("/check-user")
    public ResponseEntity<CheckUserResponse> checkUser(@RequestParam String identifier) {
        return ResponseEntity.ok(authService.checkUser(identifier));
    }

    // POST /auth/login — body: { email, password }
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    // POST /auth/register — body: full registration form
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    // POST /auth/forgot-password — sends reset email
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @RequestBody ForgotPasswordRequest req) {
        authService.sendPasswordResetEmail(req.email());
        return ResponseEntity.ok(ApiResponse.success("Reset link sent if email exists."));
    }

    // POST /auth/reset-password — sets new password using token
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully."));
    }

    // POST /auth/refresh — get new access token using refresh token
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshRequest req) {
        return ResponseEntity.ok(authService.refreshToken(req.refreshToken()));
    }
}
