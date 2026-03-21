package com.timeLocus.timelocusbackend.timetracker.dto;

import jakarta.validation.constraints.NotBlank;

// Request to create a manual time entry
public record CreateEntryRequest(
        @NotBlank String  task,
        String            date,
        String            startTime,
        String            endTime,
        Integer           duration,
        String            category,
        String            notes
) {}
