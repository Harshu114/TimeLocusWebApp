package com.timeLocus.timelocusbackend.productivity.dto;

import com.timeLocus.timelocusbackend.timetracker.dto.CategoryBreakdown;

import java.util.List;

// Returned by GET /productivity/dashboard
// Aggregates today's summary + weekly hours array for the dashboard
public record DashboardSummaryDTO(
        int              todayMinutes,
        double           focusScore,
        int              taskCount,
        List<CategoryBreakdown> breakdown,
        double[]         weekHours    // index 0=Mon, 6=Sun
) {}
