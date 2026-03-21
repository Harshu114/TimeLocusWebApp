package com.timeLocus.timelocusbackend.task.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTaskRequest(
        @NotBlank String title,
        String    priority   // high, medium, low
) {}
