package com.timeLocus.timelocusbackend.timetracker.dto;

// One category's contribution to the daily total
public record CategoryBreakdown(
        String category,
        int    minutes,
        double percentage
) {}
