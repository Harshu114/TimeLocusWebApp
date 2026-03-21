package com.timeLocus.timelocusbackend.planner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateEventRequest(
        @NotBlank String title,
        String    description,
        @NotNull  String date,       // "yyyy-MM-dd"
        String    time,              // "HH:mm"
        String    eventType          // work, meeting, deadline, personal, exam
) {}
