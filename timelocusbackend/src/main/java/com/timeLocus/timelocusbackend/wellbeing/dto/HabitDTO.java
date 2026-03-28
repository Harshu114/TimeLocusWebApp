package com.timeLocus.timelocusbackend.wellbeing.dto;

import java.util.Set;
import java.time.LocalDate;

public record HabitDTO(
        String id,
        String name,
        int currentStreak,
        int bestStreak,
        Set<LocalDate> completedDates
) {}
