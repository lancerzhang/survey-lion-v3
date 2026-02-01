
import React from 'react';
import { QuestionType, SurveyStatus, Survey } from './types';

export const APP_NAME = "Survey Lion v3";

export const MOCK_USERS = [
  { id: 'u1', name: 'Alice Smith', email: 'alice@company.com', role: 'ADMIN' },
  { id: 'u2', name: 'Bob Jones', email: 'bob@company.com', role: 'USER' },
  { id: 'u3', name: 'Charlie Brown', email: 'charlie@company.com', role: 'USER' },
];

export const ICONS = {
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>,
  Share: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>,
  Eye: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  Star: ({ filled }: { filled: boolean; key?: React.Key }) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={filled ? "text-yellow-400" : "text-gray-300"}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l-.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
  Gift: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  Archive: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
};

export const SURVEY_TEMPLATES: Partial<Survey>[] = [
  {
    title: "Employee Satisfaction Survey",
    description: "Measure team morale and identify areas for organizational improvement.",
    questions: [
      { id: 't1_q1', type: QuestionType.RATING, title: "How happy are you with your current role?", mandatory: true },
      { id: 't1_q2', type: QuestionType.SINGLE_CHOICE, title: "Do you feel valued by your manager?", mandatory: true, options: [{ id: 'o1', text: 'Yes' }, { id: 'o2', text: 'No' }, { id: 'o3', text: 'Sometimes' }] },
      { id: 't1_q3', type: QuestionType.MULTIPLE_CHOICE, title: "Which benefits do you value most?", mandatory: false, options: [{ id: 'o4', text: 'Remote Work' }, { id: 'o5', text: 'Health Insurance' }, { id: 'o6', text: 'Learning Budget' }] }
    ]
  },
  {
    title: "Event Feedback Survey",
    description: "Get insights on recent company events or workshops.",
    questions: [
      { id: 't2_q1', type: QuestionType.RATING, title: "How would you rate the event overall?", mandatory: true },
      { id: 't2_q2', type: QuestionType.RATING, title: "Quality of speakers/content?", mandatory: true },
      { id: 't2_q3', type: QuestionType.SINGLE_CHOICE, title: "Would you attend again?", mandatory: true, options: [{ id: 'o7', text: 'Definitely' }, { id: 'o8', text: 'Maybe' }, { id: 'o9', text: 'No' }] }
    ]
  },
  {
    title: "Training Evaluation Survey",
    description: "Collect feedback on internal training sessions to improve content and delivery.",
    questions: [
      { id: 't3_q1', type: QuestionType.RATING, title: "Overall, how would you rate the training?", mandatory: true },
      { id: 't3_q2', type: QuestionType.SINGLE_CHOICE, title: "Was the material easy to understand?", mandatory: true, options: [{ id: 'o10', text: 'Yes' }, { id: 'o11', text: 'No' }, { id: 'o12', text: 'Partially' }] },
      { id: 't3_q3', type: QuestionType.RATING, title: "Instructor's knowledge and clarity?", mandatory: true },
      { id: 't3_q4', type: QuestionType.MULTIPLE_CHOICE, title: "Which topics were most useful?", mandatory: false, options: [{ id: 'o13', text: 'Theory' }, { id: 'o14', text: 'Hands-on exercises' }, { id: 'o15', text: 'Group discussion' }, { id: 'o16', text: 'Case studies' }] }
    ]
  },
  {
    title: "Product Requirement Collection",
    description: "Gather feedback and requirements for upcoming product features.",
    questions: [
      { id: 't4_q1', type: QuestionType.SINGLE_CHOICE, title: "Which feature is most important to you?", mandatory: true, options: [{ id: 'o17', text: 'Performance' }, { id: 'o18', text: 'UI/UX' }, { id: 'o19', text: 'Mobile Support' }] },
      { id: 't4_q2', type: QuestionType.RATING, title: "How urgent is this requirement?", mandatory: true }
    ]
  }
];
