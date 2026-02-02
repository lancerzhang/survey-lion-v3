package com.surveylion.service;

import com.surveylion.model.Survey;
import com.surveylion.repository.SurveyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SurveyService {
    private final SurveyRepository surveyRepository;

    public List<Survey> getAllSurveys() {
        return surveyRepository.findAll();
    }

    public Page<Survey> searchSurveys(List<String> ownerIds, List<String> statuses, List<String> ids, Pageable pageable) {
        return surveyRepository.search(normalize(ownerIds), normalize(statuses), normalize(ids), pageable);
    }

    public List<Survey> getSurveysByOwner(String ownerId) {
        return surveyRepository.findByOwnerId(ownerId);
    }

    public Optional<Survey> getSurveyById(String id) {
        return surveyRepository.findById(id);
    }

    @Transactional
    public Survey saveSurvey(Survey survey) {
        return surveyRepository.save(survey);
    }

    @Transactional
    public void deleteSurvey(String id) {
        surveyRepository.deleteById(id);
    }

    private List<String> normalize(List<String> values) {
        return (values == null || values.isEmpty()) ? null : values;
    }
}
