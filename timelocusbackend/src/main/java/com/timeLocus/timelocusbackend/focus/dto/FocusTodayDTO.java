package com.timeLocus.timelocusbackend.focus.dto;

// Returned by GET /focus/today
public record FocusTodayDTO(long sessions, int totalMinutes) {}
