package com.surveylion.dto;

import com.surveylion.model.SurveyResponse;
import java.time.LocalDateTime;

public record SurveyResponseSummaryDto(
    String id,
    String surveyId,
    String userId,
    LocalDateTime submittedAt
) {
    public static SurveyResponseSummaryDto from(SurveyResponse response) {
        return new SurveyResponseSummaryDto(
            response.getId(),
            response.getSurveyId(),
            response.getUserId(),
            response.getSubmittedAt()
        );
    }
}
