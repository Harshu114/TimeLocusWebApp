package com.timeLocus.timelocusbackend.planner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateEventRequest(
        @NotBlank String title,
        String    description,
        @NotNull  String date,
        String    time,
        String    eventType,
        // Rich planning fields
        String    priority,        // low | medium | high | critical
        String    notes,
        String    subtasksJson,    // JSON string from frontend
        String    tagsJson,        // JSON string from frontend
        Integer   estimatedMins,
        Boolean   aiGenerated
) {}