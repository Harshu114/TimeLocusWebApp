package com.timeLocus.timelocusbackend.auth.dto;

public record CheckUserResponse(boolean exists, String firstName) {}
