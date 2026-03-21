package com.timeLocus.timelocusbackend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// DTO = Data Transfer Object
// Only carries data between the HTTP layer and the service layer.
// No business logic here — just fields + validation annotations.
public record LoginRequest(
        @Email    @NotBlank String email,
        @NotBlank            String password
) {}
