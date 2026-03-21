package com.timeLocus.timelocusbackend.task.dto;

public record TaskDTO(
        String  id,
        String  title,
        boolean done,
        String  priority,
        String  dueDate
) {}
