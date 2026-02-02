
import { Survey, SurveyResponse, Delegation, LotteryResult, SurveyStatus } from '../types';

const API_BASE = 'http://localhost:8080/api';

const normalizeLocalDateTime = (value: string): string => {
  const trimmed = value.replace('Z', '');
  if (trimmed.length === 16) return `${trimmed}:00`;
  if (trimmed.length > 19) return trimmed.slice(0, 19);
  return trimmed;
};

const toApiDateTime = (value?: string | number | null): string | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return new Date(value).toISOString().replace('Z', '').slice(0, 19);
  }
  return normalizeLocalDateTime(value);
};

const toInputDateTime = (value?: string | null): string => {
  if (!value) return '';
  const trimmed = value.replace('Z', '');
  return trimmed.length >= 16 ? trimmed.slice(0, 16) : trimmed;
};

const fromApiDateTime = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = new Date(value.replace('Z', ''));
  const time = parsed.getTime();
  return Number.isNaN(time) ? null : time;
};

const mapSurveyFromApi = (data: any): Survey => {
  if (data?.config) return data as Survey;
  return {
    id: data.id,
    ownerId: data.ownerId,
    title: data.title ?? '',
    description: data.description ?? '',
    status: data.status as SurveyStatus,
    questions: data.questions ?? [],
    config: {
      isAnonymous: data.isAnonymous ?? false,
      allowEditAfterSubmit: data.allowEditAfterSubmit ?? false,
      allowMultipleSubmissions: data.allowMultipleSubmissions ?? false,
      startTime: toInputDateTime(data.startTime),
      endTime: toInputDateTime(data.endTime),
      maxParticipants: data.maxParticipants ?? undefined
    },
    createdAt: fromApiDateTime(data.createdAt) ?? Date.now(),
    updatedAt: fromApiDateTime(data.updatedAt) ?? Date.now()
  };
};

const mapSurveyToApi = (survey: Survey) => ({
  id: survey.id,
  ownerId: survey.ownerId,
  title: survey.title,
  description: survey.description,
  status: survey.status,
  questions: survey.questions,
  isAnonymous: survey.config?.isAnonymous ?? false,
  allowEditAfterSubmit: survey.config?.allowEditAfterSubmit ?? false,
  allowMultipleSubmissions: survey.config?.allowMultipleSubmissions ?? false,
  startTime: toApiDateTime(survey.config?.startTime),
  endTime: toApiDateTime(survey.config?.endTime),
  maxParticipants: survey.config?.maxParticipants ?? null
});

const serializeAnswers = (answers: Record<string, any>): Record<string, string> => {
  const serialized: Record<string, string> = {};
  Object.entries(answers || {}).forEach(([key, value]) => {
    serialized[key] = JSON.stringify(value);
  });
  return serialized;
};

const deserializeAnswers = (answers: Record<string, any> | null | undefined): Record<string, any> => {
  if (!answers) return {};
  const parsed: Record<string, any> = {};
  Object.entries(answers).forEach(([key, value]) => {
    if (typeof value !== 'string') {
      parsed[key] = value;
      return;
    }
    try {
      parsed[key] = JSON.parse(value);
    } catch {
      parsed[key] = value;
    }
  });
  return parsed;
};

const mapResponseFromApi = (data: any): SurveyResponse => {
  if (typeof data?.submittedAt === 'number') return data as SurveyResponse;
  return {
    id: data.id,
    surveyId: data.surveyId,
    userId: data.userId,
    answers: deserializeAnswers(data.answers),
    submittedAt: fromApiDateTime(data.submittedAt) ?? Date.now()
  };
};

const mapResponseToApi = (response: SurveyResponse) => ({
  id: response.id,
  surveyId: response.surveyId,
  userId: response.userId,
  answers: serializeAnswers(response.answers)
});

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
      const data = await response.json();
      return Array.isArray(data) ? data.map(mapSurveyFromApi) : [];
    } catch (e) {
      // Fallback to localStorage for this demo environment
      const data = localStorage.getItem('slv3_surveys');
      return data ? JSON.parse(data) : [];
    }
  },

  saveSurvey: async (survey: Survey): Promise<void> => {
    try {
      const payload = mapSurveyToApi(survey);
      const response = await fetch(`${API_BASE}/surveys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('API Unavailable');
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
      const response = await fetch(`${API_BASE}/surveys/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('API Unavailable');
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
    try {
      const response = await fetch(`${API_BASE}/responses`);
      if (!response.ok) throw new Error('API Unavailable');
      const data = await response.json();
      return Array.isArray(data) ? data.map(mapResponseFromApi) : [];
    } catch (e) {
      const data = localStorage.getItem('slv3_responses');
      return data ? JSON.parse(data) : [];
    }
  },

  saveResponse: async (
    response: SurveyResponse,
    allowMultiple: boolean = false,
    allowEditAfterSubmit: boolean = true
  ): Promise<void> => {
    try {
      const payload = mapResponseToApi(response);
      const apiResponse = await fetch(`${API_BASE}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!apiResponse.ok) throw new Error('API Unavailable');
      return;
    } catch (e) {
      const responses = await StorageService.getResponses();
      let existingIndex = responses.findIndex(r => r.id === response.id);
      if (existingIndex === -1 && !allowMultiple) {
        existingIndex = responses.findIndex(
          r => r.surveyId === response.surveyId && r.userId === response.userId && response.userId !== 'anonymous'
        );
      }
      
      if (existingIndex > -1) {
        if (!allowEditAfterSubmit) return;
        responses[existingIndex] = { ...response, submittedAt: Date.now() };
      } else {
        responses.push({ ...response, submittedAt: Date.now() });
      }
      localStorage.setItem('slv3_responses', JSON.stringify(responses));
    }
  },

  getResponsesBySurveyId: async (surveyId: string): Promise<SurveyResponse[]> => {
    try {
      const response = await fetch(`${API_BASE}/responses/survey/${surveyId}`);
      if (!response.ok) throw new Error('API Unavailable');
      const data = await response.json();
      return Array.isArray(data) ? data.map(mapResponseFromApi) : [];
    } catch (e) {
      const all = await StorageService.getResponses();
      return all.filter(r => r.surveyId === surveyId);
    }
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
