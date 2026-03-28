package com.timeLocus.timelocusbackend.wellbeing.dto;

import java.time.LocalDate;

public record JournalDTO(
        String id,
        String entry,
        String mood,
        LocalDate date
) {}
