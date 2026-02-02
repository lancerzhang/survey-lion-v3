package com.surveylion.repository;

import com.surveylion.dto.SurveyResponseCountDto;
import com.surveylion.model.SurveyResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, String> {
    List<SurveyResponse> findBySurveyId(String surveyId);
    List<SurveyResponse> findByUserId(String userId);

    Page<SurveyResponse> findBySurveyId(String surveyId, Pageable pageable);
    Page<SurveyResponse> findByUserId(String userId, Pageable pageable);

    Optional<SurveyResponse> findFirstBySurveyIdAndUserIdOrderBySubmittedAtDesc(String surveyId, String userId);

    long countBySurveyId(String surveyId);

    @Query("""
        SELECT new com.surveylion.dto.SurveyResponseCountDto(r.surveyId, COUNT(r))
        FROM SurveyResponse r
        WHERE r.surveyId IN :surveyIds
        GROUP BY r.surveyId
        """)
    List<SurveyResponseCountDto> countBySurveyIds(@Param("surveyIds") List<String> surveyIds);
}
