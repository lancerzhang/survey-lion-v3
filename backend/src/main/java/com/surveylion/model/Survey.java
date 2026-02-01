package com.surveylion.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Table(name = "surveys")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Survey {
    @Id
    private String id;
    private String ownerId;
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String status; // DRAFT, PUBLISHED, CLOSED, ARCHIVED
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "survey_id")
    private List<Question> questions;

    private boolean isAnonymous;
    private boolean allowEditAfterSubmit;
    private boolean allowMultipleSubmissions;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer maxParticipants;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
