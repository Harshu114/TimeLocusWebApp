package com.timeLocus.timelocusbackend.wellbeing.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record CreateJournalRequest(
        @NotBlank String entry,
        String mood,
        LocalDate date
) {}
