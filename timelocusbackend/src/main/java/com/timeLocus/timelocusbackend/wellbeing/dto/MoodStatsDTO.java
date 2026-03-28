package com.timeLocus.timelocusbackend.wellbeing.dto;

public record MoodStatsDTO(
        long totalEntries,
        String mostFrequentMood
) {}
