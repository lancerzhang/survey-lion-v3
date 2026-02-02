package com.surveylion.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(
    name = "questions",
    indexes = {
        @Index(name = "idx_questions_survey", columnList = "survey_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    @Id
    private String id;
    private String type; // SINGLE_CHOICE, MULTIPLE_CHOICE, RATING
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private boolean mandatory;
    private boolean hasOther;
    private String otherLabel;
    private Integer minSelect;
    private Integer maxSelect;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "question_id")
    private List<Option> options;
}
