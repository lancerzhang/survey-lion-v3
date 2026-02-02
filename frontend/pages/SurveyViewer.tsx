
import React, { useState, useEffect } from 'react';
import { Survey, QuestionType, User, SurveyResponse, SurveyStatus } from '../types';
import { StorageService } from '../services/storageService';
import { ICONS } from '../constants.tsx';

interface SurveyViewerProps {
  user: User;
  surveyId: string;
  responseId?: string;
  from?: string;
  navigate: (view: string, params?: any) => void;
  preview?: boolean;
}

const SurveyViewer: React.FC<SurveyViewerProps> = ({ user, surveyId, responseId, from, navigate, preview = false }) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [otherInputs, setOtherInputs] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingResponse, setExistingResponse] = useState<SurveyResponse | null>(null);

  const parseOtherValue = (value: string): string | null => {
    const prefix = 'Other:';
    if (!value.startsWith(prefix)) return null;
    return value.slice(prefix.length).trimStart();
  };

  const hydrateAnswersFromResponse = (s: Survey, response: SurveyResponse) => {
    const nextAnswers: Record<string, any> = {};
    const nextOtherInputs: Record<string, string> = {};

    s.questions.forEach(q => {
      const ans = response.answers[q.id];
      if (ans === undefined) return;

      if (q.hasOther) {
        if (q.type === QuestionType.SINGLE_CHOICE && typeof ans === 'string') {
          const otherText = parseOtherValue(ans);
          if (otherText !== null) {
            nextAnswers[q.id] = 'OTHER';
            nextOtherInputs[q.id] = otherText;
            return;
          }
        }

        if (q.type === QuestionType.MULTIPLE_CHOICE && Array.isArray(ans)) {
          const normalized = ans.map(value => {
            if (typeof value === 'string') {
              const otherText = parseOtherValue(value);
              if (otherText !== null) {
                nextOtherInputs[q.id] = otherText;
                return 'OTHER';
              }
            }
            return value;
          });
          nextAnswers[q.id] = normalized;
          return;
        }
      }

      nextAnswers[q.id] = ans;
    });

    return { nextAnswers, nextOtherInputs };
  };

  const exitView = () => {
    if (from === 'my-surveys') {
      navigate('my-surveys');
      return;
    }
    navigate('dashboard');
  };

  useEffect(() => {
    // FIX: StorageService methods are asynchronous. Await the results within an async function.
    const loadSurvey = async () => {
      setError(null);
      setSubmitted(false);
      setExistingResponse(null);
      setAnswers({});
      setOtherInputs({});
      setCurrentQuestionIndex(0);

      const s = await StorageService.getSurveyById(surveyId);
      if (s) {
        let surveyResponses: SurveyResponse[] = [];
        let existing: SurveyResponse | undefined;

        if (!preview) {
          const now = new Date();
          
          // Lifecycle Check
          if (s.status === SurveyStatus.DRAFT) {
            setError(`This survey is still a draft and is not open to participants.`);
            return;
          }
          if (s.status === SurveyStatus.ARCHIVED) {
            setError(`This survey has been archived.`);
            return;
          }
          if (s.status === SurveyStatus.CLOSED) {
            setError(`This survey is closed.`);
            return;
          }

          // 1. Time Checks
          if (s.config.startTime && new Date(s.config.startTime) > now) {
            setError(`This survey hasn't started yet. It will open on ${new Date(s.config.startTime).toLocaleString()}.`);
            return;
          }
          if (s.config.endTime && new Date(s.config.endTime) < now) {
            setError(`This survey is closed. It ended on ${new Date(s.config.endTime).toLocaleString()}.`);
            return;
          }

          const needsResponses =
            Boolean(s.config.maxParticipants) ||
            Boolean(responseId) ||
            (!s.config.isAnonymous && !s.config.allowMultipleSubmissions);
          if (needsResponses) {
            surveyResponses = await StorageService.getResponsesBySurveyId(s.id);
          }

          if (responseId) {
            existing = surveyResponses.find(r => r.id === responseId);
            if (!existing) {
              setError('Response not found.');
              return;
            }
          } else if (!s.config.isAnonymous && !s.config.allowMultipleSubmissions) {
            existing = surveyResponses.find(r => r.userId === user.id);
          }

          if (existing) {
            setExistingResponse(existing);
            const hydrated = hydrateAnswersFromResponse(s, existing);
            setAnswers(hydrated.nextAnswers);
            setOtherInputs(hydrated.nextOtherInputs);
          }

          if (s.config.maxParticipants) {
            const count = surveyResponses.length;
            if (count >= s.config.maxParticipants && !existing) {
              setError(`This survey has reached its maximum participant limit of ${s.config.maxParticipants}.`);
              return;
            }
          }
        }

        setSurvey(s);
      }
    };
    loadSurvey();
  }, [surveyId, preview, user.id, responseId]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-4xl">!</div>
        <h2 className="text-2xl font-bold text-gray-900">Survey Unavailable</h2>
        <p className="text-gray-500">{error}</p>
        <button onClick={exitView} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Back to Home</button>
      </div>
    );
  }

  if (!survey) return <div>Loading...</div>;

  const currentQuestion = survey.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;
  const isReadOnly = !preview && Boolean(existingResponse) && !survey.config.allowEditAfterSubmit;
  const submitLabel = isReadOnly
    ? 'Done'
    : (existingResponse ? 'Update Response' : 'Submit Response');

  const handleNext = () => {
    if (!isReadOnly && currentQuestion.mandatory && !answers[currentQuestion.id]) {
      alert("This question is mandatory.");
      return;
    }

    const answer = answers[currentQuestion.id];
    let nextIndex = currentQuestionIndex + 1;

    if (currentQuestion.type === QuestionType.SINGLE_CHOICE && answer) {
      const opt = currentQuestion.options?.find(o => o.text === answer);
      if (opt?.skipToQuestionId === 'END') {
        if (isReadOnly) {
          exitView();
        } else {
          handleSubmit();
        }
        return;
      } else if (opt?.skipToQuestionId) {
        nextIndex = survey.questions.findIndex(q => q.id === opt.skipToQuestionId);
      }
    }

    if (nextIndex >= survey.questions.length) {
      if (isReadOnly) {
        exitView();
      } else {
        handleSubmit();
      }
    } else {
      setCurrentQuestionIndex(nextIndex);
    }
  };

  // FIX: Make handleSubmit async to await survey response saving
  const handleSubmit = async () => {
    if (preview) {
      alert("This is a preview. No data will be saved.");
      setSubmitted(true);
      return;
    }

    const finalAnswers = { ...answers };
    survey.questions.forEach(q => {
      if (q.hasOther && otherInputs[q.id]) {
        if (q.type === QuestionType.SINGLE_CHOICE && answers[q.id] === 'OTHER') {
          finalAnswers[q.id] = `Other: ${otherInputs[q.id]}`;
        } else if (q.type === QuestionType.MULTIPLE_CHOICE && Array.isArray(answers[q.id]) && answers[q.id].includes('OTHER')) {
          finalAnswers[q.id] = answers[q.id].map((v: string) => v === 'OTHER' ? `Other: ${otherInputs[q.id]}` : v);
        }
      }
    });

    const response: SurveyResponse = {
      id: existingResponse?.id || 'r' + Date.now(),
      surveyId: survey.id,
      userId: survey.config.isAnonymous ? 'anonymous' : user.id,
      answers: finalAnswers,
      submittedAt: Date.now()
    };
    await StorageService.saveResponse(
      response,
      survey.config.allowMultipleSubmissions,
      survey.config.allowEditAfterSubmit
    );
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl">✓</div>
        <h2 className="text-3xl font-bold text-gray-900">
          {preview ? 'Preview Complete' : (existingResponse ? 'Response Updated' : 'Thank you!')}
        </h2>
        <p className="text-gray-500">Your response has been recorded. Your feedback helps us improve our internal culture.</p>
        {preview ? (
          <button
            onClick={() => navigate('editor', { id: survey.id })}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Back to Editor
          </button>
        ) : (
          <button onClick={exitView} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Back to Home</button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      {isReadOnly && (
        <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm shadow-sm flex items-center justify-between">
          <span className="font-semibold">VIEW ONLY - EDITING IS DISABLED</span>
          <button
            onClick={exitView}
            className="px-3 py-1 bg-white/70 hover:bg-white rounded-md text-xs font-semibold"
          >
            Close
          </button>
        </div>
      )}
      {preview && (
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg animate-pulse flex items-center justify-between">
          <span className="font-bold">PREVIEW MODE - DATA WILL NOT BE SAVED</span>
          <button
            onClick={() => navigate('editor', { id: survey.id })}
            className="px-3 py-1 bg-white/15 hover:bg-white/25 rounded-md text-xs font-semibold"
          >
            Exit Preview
          </button>
        </div>
      )}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{survey.title}</h1>
        <div 
          className="sl-richtext text-gray-500 max-w-none"
          dangerouslySetInnerHTML={{ __html: survey.description }}
        />
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-4">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${((currentQuestionIndex + 1) / survey.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm min-h-[300px] flex flex-col">
        <div className="flex-grow space-y-6">
          <div className="flex items-start space-x-3">
            <span className="text-indigo-600 font-bold mt-1">Q{currentQuestionIndex + 1}</span>
            <h2 className="text-xl font-medium text-gray-900">
              {currentQuestion.title}
              {currentQuestion.mandatory && <span className="text-red-500 ml-1">*</span>}
            </h2>
          </div>

          {currentQuestion.type === QuestionType.SINGLE_CHOICE && (
            <div className="ml-8 space-y-3">
              {currentQuestion.options?.map(opt => (
                <label key={opt.id} className={`flex items-center p-4 rounded-xl border-2 transition cursor-pointer ${answers[currentQuestion.id] === opt.text ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input 
                    type="radio" 
                    name={currentQuestion.id} 
                    value={opt.text}
                    checked={answers[currentQuestion.id] === opt.text}
                    onChange={() => !isReadOnly && setAnswers({ ...answers, [currentQuestion.id]: opt.text })}
                    disabled={isReadOnly}
                    className="w-4 h-4 text-indigo-600 focus:ring-0"
                  />
                  <span className="ml-3 font-medium text-gray-700">{opt.text}</span>
                </label>
              ))}
              {currentQuestion.hasOther && (
                <div className={`p-4 rounded-xl border-2 transition ${answers[currentQuestion.id] === 'OTHER' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      name={currentQuestion.id} 
                      value="OTHER"
                      checked={answers[currentQuestion.id] === 'OTHER'}
                      onChange={() => !isReadOnly && setAnswers({ ...answers, [currentQuestion.id]: 'OTHER' })}
                      disabled={isReadOnly}
                      className="w-4 h-4 text-indigo-600 focus:ring-0"
                    />
                    <span className="ml-3 font-medium text-gray-700">{currentQuestion.otherLabel || 'Other'}</span>
                  </label>
                  {answers[currentQuestion.id] === 'OTHER' && (
                    <input 
                      type="text"
                      value={otherInputs[currentQuestion.id] || ''}
                      onChange={e => setOtherInputs({ ...otherInputs, [currentQuestion.id]: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="Please specify..."
                      className="mt-3 w-full border-gray-200 rounded-lg text-sm focus:ring-indigo-500"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
            <div className="ml-8 space-y-3">
              {currentQuestion.options?.map(opt => (
                <label key={opt.id} className={`flex items-center p-4 rounded-xl border-2 transition cursor-pointer ${Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(opt.text) ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input 
                    type="checkbox" 
                    checked={Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(opt.text)}
                    onChange={(e) => {
                      if (isReadOnly) return;
                      const current = answers[currentQuestion.id] || [];
                      const next = e.target.checked ? [...current, opt.text] : current.filter((i: string) => i !== opt.text);
                      setAnswers({ ...answers, [currentQuestion.id]: next });
                    }}
                    disabled={isReadOnly}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-0"
                  />
                  <span className="ml-3 font-medium text-gray-700">{opt.text}</span>
                </label>
              ))}
              {currentQuestion.hasOther && (
                <div className={`p-4 rounded-xl border-2 transition ${Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes('OTHER') ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes('OTHER')}
                      onChange={(e) => {
                        if (isReadOnly) return;
                        const current = answers[currentQuestion.id] || [];
                        const next = e.target.checked ? [...current, 'OTHER'] : current.filter((i: string) => i !== 'OTHER');
                        setAnswers({ ...answers, [currentQuestion.id]: next });
                      }}
                      disabled={isReadOnly}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-0"
                    />
                    <span className="ml-3 font-medium text-gray-700">{currentQuestion.otherLabel || 'Other'}</span>
                  </label>
                  {Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes('OTHER') && (
                    <input 
                      type="text"
                      value={otherInputs[currentQuestion.id] || ''}
                      onChange={e => setOtherInputs({ ...otherInputs, [currentQuestion.id]: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="Please specify..."
                      className="mt-3 w-full border-gray-200 rounded-lg text-sm focus:ring-indigo-500"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {currentQuestion.type === QuestionType.RATING && (
            <div className="ml-8 flex space-x-4">
              {[1, 2, 3, 4, 5].map(rating => (
                <button 
                  key={rating}
                  onClick={() => !isReadOnly && setAnswers({ ...answers, [currentQuestion.id]: rating })}
                  disabled={isReadOnly}
                  className={`group transition ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <ICONS.Star filled={answers[currentQuestion.id] >= rating} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-100">
          <button 
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="px-6 py-2 text-gray-500 font-medium hover:text-gray-900 disabled:opacity-30"
          >
            Previous
          </button>
          <button 
            onClick={handleNext}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition shadow-md shadow-indigo-100"
          >
            {isLastQuestion ? submitLabel : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyViewer;
