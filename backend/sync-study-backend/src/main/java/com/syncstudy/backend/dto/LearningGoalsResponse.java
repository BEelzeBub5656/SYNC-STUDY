package com.syncstudy.backend.dto;

public record LearningGoalsResponse(
        LearningGoalResponse shortTerm,
        LearningGoalResponse longTerm
) {
}
