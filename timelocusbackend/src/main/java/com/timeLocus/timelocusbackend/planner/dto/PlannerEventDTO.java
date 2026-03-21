package com.timeLocus.timelocusbackend.planner.dto;

// What the API returns for a single planner event
public record PlannerEventDTO(
        String  id,
        String  title,
        String  description,
        String  date,
        String  time,
        String  eventType,
        boolean done
) {}
