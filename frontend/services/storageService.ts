
import { Survey, SurveyResponse, Delegation, LotteryResult, SurveyStatus } from '../types';

const STORAGE_KEYS = {
  SURVEYS: 'slv3_surveys',
  RESPONSES: 'slv3_responses',
  DELEGATIONS: 'slv3_delegations',
  LOTTERIES: 'slv3_lotteries'
};

const get = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const set = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const StorageService = {
  // Surveys
  getSurveys: () => get<Survey[]>(STORAGE_KEYS.SURVEYS, []),
  saveSurvey: (survey: Survey) => {
    const surveys = StorageService.getSurveys();
    const index = surveys.findIndex(s => s.id === survey.id);
    if (index > -1) {
      surveys[index] = { ...survey, updatedAt: Date.now() };
    } else {
      surveys.push({ ...survey, createdAt: Date.now(), updatedAt: Date.now() });
    }
    set(STORAGE_KEYS.SURVEYS, surveys);
  },
  deleteSurvey: (id: string) => {
    const surveys = StorageService.getSurveys().filter(s => s.id !== id);
    set(STORAGE_KEYS.SURVEYS, surveys);
    const responses = StorageService.getResponses().filter(r => r.surveyId !== id);
    set(STORAGE_KEYS.RESPONSES, responses);
  },
  getSurveyById: (id: string) => StorageService.getSurveys().find(s => s.id === id),

  // Responses
  getResponses: () => get<SurveyResponse[]>(STORAGE_KEYS.RESPONSES, []),
  saveResponse: (response: SurveyResponse, allowMultiple: boolean = false) => {
    const responses = StorageService.getResponses();
    
    // If not allowing multiple, overwrite existing for this user
    const existingIndex = !allowMultiple 
      ? responses.findIndex(r => r.surveyId === response.surveyId && r.userId === response.userId && response.userId !== 'anonymous')
      : -1;
    
    if (existingIndex > -1) {
      responses[existingIndex] = { ...response, submittedAt: Date.now() };
    } else {
      responses.push({ ...response, submittedAt: Date.now() });
    }
    set(STORAGE_KEYS.RESPONSES, responses);
  },
  getResponsesBySurveyId: (surveyId: string) => 
    StorageService.getResponses().filter(r => r.surveyId === surveyId),

  // Delegations
  getDelegations: () => get<Delegation[]>(STORAGE_KEYS.DELEGATIONS, []),
  saveDelegation: (delegation: Delegation) => {
    const delegations = StorageService.getDelegations();
    delegations.push(delegation);
    set(STORAGE_KEYS.DELEGATIONS, delegations);
  },
  getDelegationsForUser: (userId: string) => 
    StorageService.getDelegations().filter(d => d.delegateId === userId),

  // Lotteries
  getLotteries: () => get<LotteryResult[]>(STORAGE_KEYS.LOTTERIES, []),
  saveLottery: (lottery: LotteryResult) => {
    const lotteries = StorageService.getLotteries();
    lotteries.push(lottery);
    set(STORAGE_KEYS.LOTTERIES, lotteries);
  },
  getLotteriesBySurveyId: (surveyId: string) => 
    StorageService.getLotteries().filter(l => l.surveyId === surveyId)
};
