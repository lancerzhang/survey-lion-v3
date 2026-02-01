
import { Survey, SurveyResponse, Delegation, LotteryResult, SurveyStatus } from '../types';

const API_BASE = '/api';

/**
 * Service to handle data persistence via REST API.
 * Currently uses local storage as a fallback for offline demonstration,
 * but implements the async interface required for the Spring Boot backend.
 */
export const StorageService = {
  // Surveys
  getSurveys: async (): Promise<Survey[]> => {
    try {
      const response = await fetch(`${API_BASE}/surveys`);
      if (!response.ok) throw new Error('API Unavailable');
      return await response.json();
    } catch (e) {
      // Fallback to localStorage for this demo environment
      const data = localStorage.getItem('slv3_surveys');
      return data ? JSON.parse(data) : [];
    }
  },

  saveSurvey: async (survey: Survey): Promise<void> => {
    try {
      await fetch(`${API_BASE}/surveys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(survey)
      });
    } catch (e) {
      const surveys = await StorageService.getSurveys();
      const index = surveys.findIndex(s => s.id === survey.id);
      if (index > -1) {
        surveys[index] = { ...survey, updatedAt: Date.now() };
      } else {
        surveys.push({ ...survey, createdAt: Date.now(), updatedAt: Date.now() });
      }
      localStorage.setItem('slv3_surveys', JSON.stringify(surveys));
    }
  },

  deleteSurvey: async (id: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/surveys/${id}`, { method: 'DELETE' });
    } catch (e) {
      const surveys = (await StorageService.getSurveys()).filter(s => s.id !== id);
      localStorage.setItem('slv3_surveys', JSON.stringify(surveys));
    }
  },

  getSurveyById: async (id: string): Promise<Survey | undefined> => {
    const all = await StorageService.getSurveys();
    return all.find(s => s.id === id);
  },

  // Responses
  getResponses: async (): Promise<SurveyResponse[]> => {
    const data = localStorage.getItem('slv3_responses');
    return data ? JSON.parse(data) : [];
  },

  saveResponse: async (response: SurveyResponse, allowMultiple: boolean = false): Promise<void> => {
    const responses = await StorageService.getResponses();
    const existingIndex = !allowMultiple 
      ? responses.findIndex(r => r.surveyId === response.surveyId && r.userId === response.userId && response.userId !== 'anonymous')
      : -1;
    
    if (existingIndex > -1) {
      responses[existingIndex] = { ...response, submittedAt: Date.now() };
    } else {
      responses.push({ ...response, submittedAt: Date.now() });
    }
    localStorage.setItem('slv3_responses', JSON.stringify(responses));
  },

  getResponsesBySurveyId: async (surveyId: string): Promise<SurveyResponse[]> => {
    const all = await StorageService.getResponses();
    return all.filter(r => r.surveyId === surveyId);
  },

  // Delegations & Lotteries (simplified local storage for this phase)
  getDelegations: (): Delegation[] => {
    const data = localStorage.getItem('slv3_delegations');
    return data ? JSON.parse(data) : [];
  },

  saveDelegation: (delegation: Delegation) => {
    const delegations = StorageService.getDelegations();
    delegations.push(delegation);
    localStorage.setItem('slv3_delegations', JSON.stringify(delegations));
  },

  getDelegationsForUser: (userId: string) => 
    StorageService.getDelegations().filter(d => d.delegateId === userId)
};
