package com.timeLocus.timelocusbackend.auth.dto;

import com.timeLocus.timelocusbackend.user.User;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// RegisterRequest accepts userType as a STRING (not enum directly)
// so it handles BOTH "student" and "STUDENT" from the frontend.
public record RegisterRequest(
        @NotBlank           String        firstName,
        @NotBlank           String        lastName,
        @Email @NotBlank    String        email,
        @Size(min = 8)      String        password,
        Integer                           age,
        String                            gender,
        String                            profession,
        String                            aim,
                            String        userTypeRaw   // raw string, converted below
) {
    // Convert the raw string to enum — handles lowercase AND uppercase
    public User.UserType userType() {
        if (userTypeRaw == null) return User.UserType.STUDENT;
        try {
            return User.UserType.valueOf(userTypeRaw.toUpperCase());
        } catch (IllegalArgumentException e) {
            return User.UserType.STUDENT;
        }
    }

    // Jackson needs this to map "userType" JSON field → "userTypeRaw" field
    @JsonCreator
    public static RegisterRequest create(
            @JsonProperty("firstName")  String firstName,
            @JsonProperty("lastName")   String lastName,
            @JsonProperty("email")      String email,
            @JsonProperty("password")   String password,
            @JsonProperty("age")        Integer age,
            @JsonProperty("gender")     String gender,
            @JsonProperty("profession") String profession,
            @JsonProperty("aim")        String aim,
            @JsonProperty("userType")   String userType
    ) {
        return new RegisterRequest(firstName, lastName, email, password, age, gender, profession, aim, userType);
    }
}