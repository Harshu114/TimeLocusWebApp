package com.timeLocus.timelocusbackend.auth.dto;

// DTO for updating user theme preferences
public record UpdateThemeRequest(
        String theme,       // "light" or "dark"
        String themeColor   // "blue", "purple", "green", "orange", "pink", "teal"
) {}
