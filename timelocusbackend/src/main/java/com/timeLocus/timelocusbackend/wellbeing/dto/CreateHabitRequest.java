package com.timeLocus.timelocusbackend.wellbeing.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateHabitRequest(
        @NotBlank String name
) {}
