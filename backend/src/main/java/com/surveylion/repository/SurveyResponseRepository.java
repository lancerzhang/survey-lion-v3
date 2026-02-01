package com.surveylion.repository;

import com.surveylion.model.SurveyResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, String> {
    List<SurveyResponse> findBySurveyId(String surveyId);
    List<SurveyResponse> findByUserId(String userId);
}
