package com.timeLocus.timelocusbackend.auth.dto;

// Returned to the client after login or register.
// Contains the JWT token + user info.
public record AuthResponse(
        String       token,
        String       refreshToken,
        UserResponse user
) {}
