package com.timeLocus.timelocusbackend.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(
        @NotBlank String message,
        String    context    // e.g. "student user named Harshal"
) {}
