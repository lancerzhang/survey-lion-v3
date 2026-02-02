package com.surveylion.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(
    name = "survey_responses",
    indexes = {
        @Index(name = "idx_responses_survey_user", columnList = "survey_id,user_id"),
        @Index(name = "idx_responses_survey_submitted", columnList = "survey_id,submitted_at"),
        @Index(name = "idx_responses_user_submitted", columnList = "user_id,submitted_at")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurveyResponse {
    @Id
    private String id;
    private String surveyId;
    private String userId; // 'anonymous' or user ID
    
    @ElementCollection
    @CollectionTable(
        name = "response_answers",
        joinColumns = @JoinColumn(name = "response_id"),
        indexes = {
            @Index(name = "idx_response_answers_response_question", columnList = "response_id,question_id"),
            @Index(name = "idx_response_answers_question", columnList = "question_id")
        }
    )
    @MapKeyColumn(name = "question_id")
    @Column(name = "answer", columnDefinition = "TEXT")
    private Map<String, String> answers;
    
    private LocalDateTime submittedAt;

    @PrePersist
    protected void onSubmit() {
        submittedAt = LocalDateTime.now();
    }
}
