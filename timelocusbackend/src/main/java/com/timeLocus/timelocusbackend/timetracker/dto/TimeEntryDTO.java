package com.timeLocus.timelocusbackend.timetracker.dto;

// Response DTO — what the API returns for a single time entry
public record TimeEntryDTO(
        String  id,
        String  task,
        String  date,
        String  startTime,
        String  endTime,
        Integer duration,
        String  category,
        String  notes,
        boolean manual
) {}
