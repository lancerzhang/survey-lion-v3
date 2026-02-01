package com.surveylion.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "survey_options")
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
