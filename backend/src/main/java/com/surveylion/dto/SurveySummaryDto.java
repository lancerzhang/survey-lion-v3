package com.surveylion.dto;

import com.surveylion.model.Survey;
import java.time.LocalDateTime;

public record SurveySummaryDto(
    String id,
    String ownerId,
    String title,
    String description,
    String status,
    boolean isAnonymous,
    boolean allowEditAfterSubmit,
    boolean allowMultipleSubmissions,
    LocalDateTime startTime,
    LocalDateTime endTime,
    Integer maxParticipants,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static SurveySummaryDto from(Survey survey) {
        return new SurveySummaryDto(
            survey.getId(),
            survey.getOwnerId(),
            survey.getTitle(),
            survey.getDescription(),
            survey.getStatus(),
            survey.isAnonymous(),
            survey.isAllowEditAfterSubmit(),
            survey.isAllowMultipleSubmissions(),
            survey.getStartTime(),
            survey.getEndTime(),
            survey.getMaxParticipants(),
            survey.getCreatedAt(),
            survey.getUpdatedAt()
        );
    }
}
