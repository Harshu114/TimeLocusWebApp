package com.timeLocus.timelocusbackend.task.dto;

// Returned by GET /tasks/stats — total and completed count
public record TaskStatsDTO(long total, long done) {}
