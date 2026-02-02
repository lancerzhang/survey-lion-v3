
import { Survey, SurveyResponse, Delegation, LotteryResult, SurveyStatus } from '../types';

const API_BASE = 'http://localhost:8080/api';

type QueryValue = string | number | boolean | string[] | undefined | null;

type PageResult<T> = {
  items: T[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  last: boolean;
};

const appendQuery = (url: string, params: Record<string, QueryValue>): string => {
  const [base, existing] = url.split('?');
  const search = new URLSearchParams(existing ?? '');
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      search.set(key, value.join(','));
      return;
    }
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
};

const extractContent = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.content)) return data.content as T[];
  return [];
};

const normalizePageResult = <T>(data: any, page: number, size: number): PageResult<T> => {
  if (Array.isArray(data)) {
    const totalElements = data.length;
    const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
    const start = page * size;
    const items = data.slice(start, start + size);
    return {
      items,
      page,
      size,
      totalPages,
      totalElements,
      last: totalPages === 0 || page >= totalPages - 1
    };
  }

  const items = extractContent<T>(data);
  const totalElements = typeof data?.totalElements === 'number' ? data.totalElements : items.length;
  const totalPages = typeof data?.totalPages === 'number'
    ? data.totalPages
    : (totalElements === 0 ? 0 : Math.ceil(totalElements / size));
  const pageNumber = typeof data?.number === 'number' ? data.number : page;
  const sizeOut = typeof data?.size === 'number' ? data.size : size;
  const last = typeof data?.last === 'boolean' ? data.last : (totalPages === 0 || pageNumber >= totalPages - 1);
  return {
    items,
    page: pageNumber,
    size: sizeOut,
    totalPages,
    totalElements,
    last
  };
};

const fetchPage = async <T>(url: string): Promise<T[]> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('API Unavailable');
  const data = await response.json();
  return extractContent<T>(data);
};

const fetchPageResult = async <T>(url: string, page: number, size: number): Promise<PageResult<T>> => {
  const response = await fetch(appendQuery(url, { page, size }));
  if (!response.ok) throw new Error('API Unavailable');
  const data = await response.json();
  return normalizePageResult<T>(data, page, size);
};

const fetchAllPages = async <T>(url: string, pageSize: number): Promise<T[]> => {
  let page = 0;
  const results: T[] = [];
  while (true) {
    const pagedUrl = appendQuery(url, { page, size: pageSize });
    const response = await fetch(pagedUrl);
    if (!response.ok) throw new Error('API Unavailable');
    const data = await response.json();
    const content = extractContent<T>(data);
    results.push(...content);
    if (Array.isArray(data)) break;
    if (data?.last === true || content.length === 0) break;
    page += 1;
  }
  return results;
};

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
  getSurveys: async (query: {
    ownerIds?: string[];
    statuses?: (SurveyStatus | string)[];
    ids?: string[];
    pageSize?: number;
    allPages?: boolean;
  } = {}): Promise<Survey[]> => {
    try {
      const baseUrl = appendQuery(`${API_BASE}/surveys`, {
        ownerIds: query.ownerIds,
        statuses: query.statuses,
        ids: query.ids
      });
      const pageSize = query.pageSize ?? 200;
      const data = query.allPages
        ? await fetchAllPages<any>(baseUrl, pageSize)
        : await fetchPage<any>(appendQuery(baseUrl, { page: 0, size: pageSize }));
      return data.map(mapSurveyFromApi);
    } catch (e) {
      // Fallback to localStorage for this demo environment
      const data = localStorage.getItem('slv3_surveys');
      let surveys: Survey[] = data ? JSON.parse(data) : [];
      if (query.ownerIds?.length) {
        surveys = surveys.filter(s => query.ownerIds!.includes(s.ownerId));
      }
      if (query.statuses?.length) {
        surveys = surveys.filter(s => query.statuses!.includes(s.status));
      }
      if (query.ids?.length) {
        surveys = surveys.filter(s => query.ids!.includes(s.id));
      }
      return surveys;
    }
  },

  getSurveysPage: async (query: {
    ownerIds?: string[];
    statuses?: (SurveyStatus | string)[];
    ids?: string[];
    page?: number;
    size?: number;
  } = {}): Promise<PageResult<Survey>> => {
    const page = query.page ?? 0;
    const size = query.size ?? 12;
    try {
      const baseUrl = appendQuery(`${API_BASE}/surveys`, {
        ownerIds: query.ownerIds,
        statuses: query.statuses,
        ids: query.ids
      });
      const data = await fetchPageResult<any>(baseUrl, page, size);
      return {
        ...data,
        items: data.items.map(mapSurveyFromApi)
      };
    } catch (e) {
      const data = localStorage.getItem('slv3_surveys');
      let surveys: Survey[] = data ? JSON.parse(data) : [];
      if (query.ownerIds?.length) {
        surveys = surveys.filter(s => query.ownerIds!.includes(s.ownerId));
      }
      if (query.statuses?.length) {
        surveys = surveys.filter(s => query.statuses!.includes(s.status));
      }
      if (query.ids?.length) {
        surveys = surveys.filter(s => query.ids!.includes(s.id));
      }
      return normalizePageResult<Survey>(surveys, page, size);
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
    try {
      const response = await fetch(`${API_BASE}/surveys/${id}`);
      if (!response.ok) throw new Error('API Unavailable');
      const data = await response.json();
      return mapSurveyFromApi(data);
    } catch (e) {
      const all = await StorageService.getSurveys();
      return all.find(s => s.id === id);
    }
  },

  // Responses
  getResponses: async (query: {
    pageSize?: number;
    allPages?: boolean;
  } = {}): Promise<SurveyResponse[]> => {
    try {
      const pageSize = query.pageSize ?? 200;
      const data = query.allPages
        ? await fetchAllPages<any>(`${API_BASE}/responses`, pageSize)
        : await fetchPage<any>(appendQuery(`${API_BASE}/responses`, { page: 0, size: pageSize }));
      return data.map(mapResponseFromApi);
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

  getResponsesBySurveyId: async (
    surveyId: string,
    options: { includeAnswers?: boolean; pageSize?: number; allPages?: boolean } = {}
  ): Promise<SurveyResponse[]> => {
    try {
      const baseUrl = appendQuery(`${API_BASE}/responses/survey/${surveyId}`, {
        includeAnswers: options.includeAnswers ?? false
      });
      const pageSize = options.pageSize ?? 200;
      const data = options.allPages
        ? await fetchAllPages<any>(baseUrl, pageSize)
        : await fetchPage<any>(appendQuery(baseUrl, { page: 0, size: pageSize }));
      return data.map(mapResponseFromApi);
    } catch (e) {
      const all = await StorageService.getResponses({ allPages: true });
      return all.filter(r => r.surveyId === surveyId);
    }
  },

  getResponsesBySurveyIdPage: async (
    surveyId: string,
    options: { includeAnswers?: boolean; page?: number; size?: number } = {}
  ): Promise<PageResult<SurveyResponse>> => {
    const page = options.page ?? 0;
    const size = options.size ?? 50;
    try {
      const baseUrl = appendQuery(`${API_BASE}/responses/survey/${surveyId}`, {
        includeAnswers: options.includeAnswers ?? false
      });
      const data = await fetchPageResult<any>(baseUrl, page, size);
      return {
        ...data,
        items: data.items.map(mapResponseFromApi)
      };
    } catch (e) {
      const all = await StorageService.getResponses({ allPages: true });
      const filtered = all.filter(r => r.surveyId === surveyId);
      return normalizePageResult<SurveyResponse>(filtered, page, size);
    }
  },

  getResponsesByUserId: async (
    userId: string,
    options: { includeAnswers?: boolean; pageSize?: number; allPages?: boolean } = {}
  ): Promise<SurveyResponse[]> => {
    try {
      const baseUrl = appendQuery(`${API_BASE}/responses/user/${userId}`, {
        includeAnswers: options.includeAnswers ?? false
      });
      const pageSize = options.pageSize ?? 200;
      const data = options.allPages
        ? await fetchAllPages<any>(baseUrl, pageSize)
        : await fetchPage<any>(appendQuery(baseUrl, { page: 0, size: pageSize }));
      return data.map(mapResponseFromApi);
    } catch (e) {
      const all = await StorageService.getResponses({ allPages: true });
      return all.filter(r => r.userId === userId);
    }
  },

  getResponsesByUserIdPage: async (
    userId: string,
    options: { includeAnswers?: boolean; page?: number; size?: number } = {}
  ): Promise<PageResult<SurveyResponse>> => {
    const page = options.page ?? 0;
    const size = options.size ?? 20;
    try {
      const baseUrl = appendQuery(`${API_BASE}/responses/user/${userId}`, {
        includeAnswers: options.includeAnswers ?? false
      });
      const data = await fetchPageResult<any>(baseUrl, page, size);
      return {
        ...data,
        items: data.items.map(mapResponseFromApi)
      };
    } catch (e) {
      const all = await StorageService.getResponses({ allPages: true });
      const filtered = all.filter(r => r.userId === userId);
      return normalizePageResult<SurveyResponse>(filtered, page, size);
    }
  },

  getResponseBySurveyAndUser: async (surveyId: string, userId: string): Promise<SurveyResponse | undefined> => {
    try {
      const response = await fetch(`${API_BASE}/responses/survey/${surveyId}/user/${userId}`);
      if (!response.ok) throw new Error('API Unavailable');
      const data = await response.json();
      return mapResponseFromApi(data);
    } catch (e) {
      const all = await StorageService.getResponses({ allPages: true });
      return all.find(r => r.surveyId === surveyId && r.userId === userId);
    }
  },

  getResponseById: async (id: string): Promise<SurveyResponse | undefined> => {
    try {
      const response = await fetch(`${API_BASE}/responses/${id}`);
      if (!response.ok) throw new Error('API Unavailable');
      const data = await response.json();
      return mapResponseFromApi(data);
    } catch (e) {
      const all = await StorageService.getResponses({ allPages: true });
      return all.find(r => r.id === id);
    }
  },

  getResponseCountBySurveyId: async (surveyId: string): Promise<number> => {
    try {
      const response = await fetch(appendQuery(`${API_BASE}/responses/count`, { surveyId }));
      if (!response.ok) throw new Error('API Unavailable');
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) return data[0].count ?? 0;
      return 0;
    } catch (e) {
      const all = await StorageService.getResponses({ allPages: true });
      return all.filter(r => r.surveyId === surveyId).length;
    }
  },

  getResponseCountsBySurveyIds: async (surveyIds: string[]): Promise<Record<string, number>> => {
    if (surveyIds.length === 0) return {};
    try {
      const response = await fetch(appendQuery(`${API_BASE}/responses/count`, { surveyIds }));
      if (!response.ok) throw new Error('API Unavailable');
      const data = await response.json();
      const counts: Record<string, number> = {};
      (Array.isArray(data) ? data : []).forEach((item: any) => {
        counts[item.surveyId] = item.count ?? 0;
      });
      return counts;
    } catch (e) {
      const all = await StorageService.getResponses({ allPages: true });
      const counts: Record<string, number> = {};
      all.forEach(r => {
        if (!surveyIds.includes(r.surveyId)) return;
        counts[r.surveyId] = (counts[r.surveyId] || 0) + 1;
      });
      return counts;
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
