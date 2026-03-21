package com.timeLocus.timelocusbackend.auth.dto;

// Safe user info returned to the client — never expose the password hash.
public record UserResponse(
        String id,
        String firstName,
        String lastName,
        String email,
        String userType
) {}
