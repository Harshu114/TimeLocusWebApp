package com.timeLocus.timelocusbackend.focus.dto;

public record CompleteSessionRequest(
        String mode,            // pomodoro, deep, sprint
        int    durationMinutes
) {}
