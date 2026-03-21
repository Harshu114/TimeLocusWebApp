package com.timeLocus.timelocusbackend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank          String token,
        @Size(min = 8)     String newPassword
) {}
