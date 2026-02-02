package com.surveylion.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "survey_options",
    indexes = {
        @Index(name = "idx_options_question", columnList = "question_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Option {
    @Id
    private String id;
    private String text;
    private String skipToQuestionId;
}
