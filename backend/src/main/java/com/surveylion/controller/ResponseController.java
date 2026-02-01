
package com.surveylion.controller;

import com.surveylion.model.SurveyResponse;
import com.surveylion.repository.SurveyResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responses")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ResponseController {

    private final SurveyResponseRepository responseRepository;

    @GetMapping
    public List<SurveyResponse> getAllResponses() {
        return responseRepository.findAll();
    }

    @PostMapping
    public SurveyResponse submitResponse(@RequestBody SurveyResponse response) {
        // Simple overwrite logic for non-anonymous users if needed could go here
        return responseRepository.save(response);
    }

    @GetMapping("/survey/{surveyId}")
    public List<SurveyResponse> getResponsesBySurvey(@PathVariable String surveyId) {
        return responseRepository.findBySurveyId(surveyId);
    }

    @GetMapping("/user/{userId}")
    public List<SurveyResponse> getResponsesByUser(@PathVariable String userId) {
        return responseRepository.findByUserId(userId);
    }
}
