package com.timeLocus.timelocusbackend.timetracker.dto;

import java.util.List;

// Daily summary — returned by GET /time-entries/summary/daily
public record DailySummaryDTO(
        String                  date,
        int                     totalMinutes,
        double                  focusScore,
        int                     taskCount,
        List<CategoryBreakdown> breakdown
) {}
