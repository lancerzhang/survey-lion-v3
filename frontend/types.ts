
export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  RATING = 'RATING'
}

export enum SurveyStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

export interface Option {
  id: string;
  text: string;
  skipToQuestionId?: string; // Logic skip
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  mandatory: boolean;
  options?: Option[];
  hasOther?: boolean;
  otherLabel?: string;
  minSelect?: number; // For multi-choice
  maxSelect?: number; // For multi-choice
}

export interface SurveyConfig {
  isAnonymous: boolean;
  allowEditAfterSubmit: boolean;
  allowMultipleSubmissions?: boolean;
  startTime?: string;
  endTime?: string;
  maxParticipants?: number;
}

export interface Survey {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  status: SurveyStatus;
  questions: Question[];
  config: SurveyConfig;
  createdAt: number;
  updatedAt: number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string | 'anonymous';
  answers: Record<string, any>; // questionId -> answer
  submittedAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface Delegation {
  id: string;
  ownerId: string;
  delegateId: string;
  surveyId?: string; // If null, it's a global delegation
  permissions: ('CREATE' | 'EDIT' | 'VIEW_RESULTS')[];
}

export interface LotteryResult {
  id: string;
  surveyId: string;
  prizeName: string;
  winners: string[]; // User IDs or "Participant X"
  drawnAt: number;
}
