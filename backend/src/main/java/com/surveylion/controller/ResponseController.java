
package com.surveylion.controller;

import com.surveylion.dto.SurveyResponseCountDto;
import com.surveylion.dto.SurveyResponseSummaryDto;
import com.surveylion.model.SurveyResponse;
import com.surveylion.repository.SurveyResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/responses")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ResponseController {

    private final SurveyResponseRepository responseRepository;

    @GetMapping
    public Page<SurveyResponseSummaryDto> getAllResponses(
            @PageableDefault(size = 100, sort = "submittedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return responseRepository.findAll(pageable).map(SurveyResponseSummaryDto::from);
    }

    @PostMapping
    public SurveyResponse submitResponse(@RequestBody SurveyResponse response) {
        // Simple overwrite logic for non-anonymous users if needed could go here
        return responseRepository.save(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SurveyResponse> getResponseById(@PathVariable String id) {
        return responseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/survey/{surveyId}")
    public Page<?> getResponsesBySurvey(
            @PathVariable String surveyId,
            @RequestParam(defaultValue = "false") boolean includeAnswers,
            @PageableDefault(size = 100, sort = "submittedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<SurveyResponse> page = responseRepository.findBySurveyId(surveyId, pageable);
        if (includeAnswers) return page;
        return page.map(SurveyResponseSummaryDto::from);
    }

    @GetMapping("/survey/{surveyId}/user/{userId}")
    public ResponseEntity<SurveyResponse> getResponseBySurveyAndUser(
            @PathVariable String surveyId,
            @PathVariable String userId
    ) {
        return responseRepository.findFirstBySurveyIdAndUserIdOrderBySubmittedAtDesc(surveyId, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public Page<?> getResponsesByUser(
            @PathVariable String userId,
            @RequestParam(defaultValue = "false") boolean includeAnswers,
            @PageableDefault(size = 100, sort = "submittedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<SurveyResponse> page = responseRepository.findByUserId(userId, pageable);
        if (includeAnswers) return page;
        return page.map(SurveyResponseSummaryDto::from);
    }

    @GetMapping("/count")
    public List<SurveyResponseCountDto> getResponseCounts(
            @RequestParam(required = false) List<String> surveyIds,
            @RequestParam(required = false) String surveyId
    ) {
        List<String> merged = mergeParams(surveyIds, surveyId);
        if (merged == null || merged.isEmpty()) return List.of();
        if (merged.size() == 1) {
            long count = responseRepository.countBySurveyId(merged.get(0));
            return List.of(new SurveyResponseCountDto(merged.get(0), count));
        }
        return responseRepository.countBySurveyIds(merged);
    }

    private List<String> mergeParams(List<String> values, String singleValue) {
        List<String> merged = new ArrayList<>();
        if (values != null && !values.isEmpty()) merged.addAll(values);
        if (singleValue != null && !singleValue.isBlank()) merged.add(singleValue);
        return merged.isEmpty() ? null : merged;
    }
}
