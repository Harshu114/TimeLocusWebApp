package com.timeLocus.timelocusbackend.auth;

import com.timeLocus.timelocusbackend.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.timeLocus.timelocusbackend.user.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/check-user")
    public ResponseEntity<CheckUserResponse> checkUser(@RequestParam String identifier) {
        return ResponseEntity.ok(authService.checkUser(identifier));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        authService.sendPasswordResetEmail(req.email());
        return ResponseEntity.ok(ApiResponse.success("Reset link sent if email exists."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully."));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshRequest req) {
        return ResponseEntity.ok(authService.refreshToken(req.refreshToken()));
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record LoginRequest(
            @Email    String email,
            @NotBlank String password
    ) {}

    public record RegisterRequest(
            @NotBlank String firstName,
            @NotBlank String lastName,
            @Email    String email,
            @Size(min = 8) String password,
            Integer age,
            String  gender,
            String  profession,
            @NotNull User.UserType userType
    ) {}

    public record ForgotPasswordRequest(String email) {}

    public record ResetPasswordRequest(
            @NotBlank String token,
            @Size(min = 8) String newPassword
    ) {}

    public record RefreshRequest(String refreshToken) {}

    public record CheckUserResponse(boolean exists, String firstName) {}

    public record AuthResponse(
            String       token,
            String       refreshToken,
            UserResponse user
    ) {}

    public record UserResponse(
            String id,
            String firstName,
            String lastName,
            String email,
            String userType
    ) {}
}