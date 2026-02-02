package com.surveylion.controller;

import com.surveylion.dto.SurveySummaryDto;
import com.surveylion.model.Survey;
import com.surveylion.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/surveys")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    @GetMapping
    public Page<SurveySummaryDto> getAllSurveys(
            @RequestParam(required = false) List<String> ownerIds,
            @RequestParam(required = false) String ownerId,
            @RequestParam(required = false) List<String> statuses,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) List<String> ids,
            @PageableDefault(size = 50, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        List<String> normalizedOwnerIds = mergeParams(ownerIds, ownerId);
        List<String> normalizedStatuses = mergeParams(statuses, status);
        return surveyService.searchSurveys(normalizedOwnerIds, normalizedStatuses, ids, pageable)
                .map(SurveySummaryDto::from);
    }

    @PostMapping
    public Survey createOrUpdateSurvey(@RequestBody Survey survey) {
        return surveyService.saveSurvey(survey);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Survey> getSurvey(@PathVariable String id) {
        return surveyService.getSurveyById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSurvey(@PathVariable String id) {
        surveyService.deleteSurvey(id);
        return ResponseEntity.ok().build();
    }

    private List<String> mergeParams(List<String> values, String singleValue) {
        List<String> merged = new ArrayList<>();
        if (values != null && !values.isEmpty()) merged.addAll(values);
        if (singleValue != null && !singleValue.isBlank()) merged.add(singleValue);
        return merged.isEmpty() ? null : merged;
    }
}
