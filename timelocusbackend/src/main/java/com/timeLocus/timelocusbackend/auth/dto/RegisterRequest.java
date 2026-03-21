package com.timeLocus.timelocusbackend.auth.dto;

import com.timeLocus.timelocusbackend.user.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank            String        firstName,
        @NotBlank            String        lastName,
        @Email    @NotBlank  String        email,
        @Size(min = 8)       String        password,
        Integer                            age,
        String                             gender,
        String                             profession,
        @NotNull             User.UserType userType
) {}
