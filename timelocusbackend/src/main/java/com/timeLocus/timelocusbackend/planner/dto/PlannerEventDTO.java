package com.timeLocus.timelocusbackend.planner.dto;

public record PlannerEventDTO(
        String  id,
        String  title,
        String  description,
        String  date,
        String  time,
        String  eventType,
        boolean done,
        // Rich fields
        String  priority,
        String  notes,
        String  subtasksJson,
        String  tagsJson,
        Integer estimatedMins,
        boolean aiGenerated
) {}