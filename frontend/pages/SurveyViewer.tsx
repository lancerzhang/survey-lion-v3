
import React, { useState, useEffect } from 'react';
import { Survey, QuestionType, User, SurveyResponse, SurveyStatus } from '../types';
import { StorageService } from '../services/storageService';
import { ICONS } from '../constants.tsx';

interface SurveyViewerProps {
  user: User;
  surveyId: string;
  navigate: (view: string, params?: any) => void;
  preview?: boolean;
}

const SurveyViewer: React.FC<SurveyViewerProps> = ({ user, surveyId, navigate, preview = false }) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [otherInputs, setOtherInputs] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = StorageService.getSurveyById(surveyId);
    if (s) {
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

        // 2. Participant Limit Check
        if (s.config.maxParticipants) {
          const count = StorageService.getResponsesBySurveyId(s.id).length;
          if (count >= s.config.maxParticipants) {
            setError(`This survey has reached its maximum participant limit of ${s.config.maxParticipants}.`);
            return;
          }
        }
      }

      setSurvey(s);
    }
  }, [surveyId, preview]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-4xl">!</div>
        <h2 className="text-2xl font-bold text-gray-900">Survey Unavailable</h2>
        <p className="text-gray-500">{error}</p>
        <button onClick={() => navigate('dashboard')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Back to Home</button>
      </div>
    );
  }

  if (!survey) return <div>Loading...</div>;

  const currentQuestion = survey.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;

  const handleNext = () => {
    if (currentQuestion.mandatory && !answers[currentQuestion.id]) {
      alert("This question is mandatory.");
      return;
    }

    const answer = answers[currentQuestion.id];
    let nextIndex = currentQuestionIndex + 1;

    if (currentQuestion.type === QuestionType.SINGLE_CHOICE && answer) {
      const opt = currentQuestion.options?.find(o => o.text === answer);
      if (opt?.skipToQuestionId === 'END') {
        handleSubmit();
        return;
      } else if (opt?.skipToQuestionId) {
        nextIndex = survey.questions.findIndex(q => q.id === opt.skipToQuestionId);
      }
    }

    if (nextIndex >= survey.questions.length) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const handleSubmit = () => {
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
      id: 'r' + Date.now(),
      surveyId: survey.id,
      userId: survey.config.isAnonymous ? 'anonymous' : user.id,
      answers: finalAnswers,
      submittedAt: Date.now()
    };
    StorageService.saveResponse(response, survey.config.allowMultipleSubmissions);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl">✓</div>
        <h2 className="text-3xl font-bold text-gray-900">{preview ? 'Preview Complete' : 'Thank you!'}</h2>
        <p className="text-gray-500">Your response has been recorded. Your feedback helps us improve our internal culture.</p>
        <button onClick={() => navigate('dashboard')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      {preview && (
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-center font-bold text-sm shadow-lg animate-pulse">
          PREVIEW MODE - DATA WILL NOT BE SAVED
        </div>
      )}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{survey.title}</h1>
        <div 
          className="text-gray-500 prose prose-indigo max-w-none"
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
                    onChange={() => setAnswers({ ...answers, [currentQuestion.id]: opt.text })}
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
                      onChange={() => setAnswers({ ...answers, [currentQuestion.id]: 'OTHER' })}
                      className="w-4 h-4 text-indigo-600 focus:ring-0"
                    />
                    <span className="ml-3 font-medium text-gray-700">{currentQuestion.otherLabel || 'Other'}</span>
                  </label>
                  {answers[currentQuestion.id] === 'OTHER' && (
                    <input 
                      type="text"
                      value={otherInputs[currentQuestion.id] || ''}
                      onChange={e => setOtherInputs({ ...otherInputs, [currentQuestion.id]: e.target.value })}
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
                      const current = answers[currentQuestion.id] || [];
                      const next = e.target.checked ? [...current, opt.text] : current.filter((i: string) => i !== opt.text);
                      setAnswers({ ...answers, [currentQuestion.id]: next });
                    }}
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
                        const current = answers[currentQuestion.id] || [];
                        const next = e.target.checked ? [...current, 'OTHER'] : current.filter((i: string) => i !== 'OTHER');
                        setAnswers({ ...answers, [currentQuestion.id]: next });
                      }}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-0"
                    />
                    <span className="ml-3 font-medium text-gray-700">{currentQuestion.otherLabel || 'Other'}</span>
                  </label>
                  {Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes('OTHER') && (
                    <input 
                      type="text"
                      value={otherInputs[currentQuestion.id] || ''}
                      onChange={e => setOtherInputs({ ...otherInputs, [currentQuestion.id]: e.target.value })}
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
                  onClick={() => setAnswers({ ...answers, [currentQuestion.id]: rating })}
                  className="group transition"
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
            {isLastQuestion ? 'Submit Response' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyViewer;
