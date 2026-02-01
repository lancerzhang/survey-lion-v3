
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Survey, Question, QuestionType, Option, SurveyStatus, User } from '../types';
import { StorageService } from '../services/storageService';
import { ICONS } from '../constants.tsx';
import RichTextEditor from '../components/RichTextEditor';

interface SurveyEditorProps {
  user: User;
  surveyId?: string;
  navigate: (view: string, params?: any) => void;
}

const SurveyEditor: React.FC<SurveyEditorProps> = ({ user, surveyId, navigate }) => {
  const [survey, setSurvey] = useState<Survey>({
    id: surveyId || 's' + Date.now(),
    ownerId: user.id,
    title: '',
    description: '',
    status: SurveyStatus.DRAFT,
    questions: [],
    config: {
      isAnonymous: false,
      allowEditAfterSubmit: true,
      allowMultipleSubmissions: false,
      startTime: '',
      endTime: '',
      maxParticipants: undefined
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [bulkPasteTarget, setBulkPasteTarget] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState('');
  const lastSavedRef = useRef(Date.now());

  useEffect(() => {
    // FIX: StorageService.getSurveyById is asynchronous.
    const loadSurvey = async () => {
      if (surveyId) {
        const existing = await StorageService.getSurveyById(surveyId);
        if (existing) setSurvey(existing);
      }
    };
    loadSurvey();
  }, [surveyId]);

  // FIX: Make save async to await StorageService.saveSurvey
  const save = useCallback(async () => {
    if (!survey.title) return;
    setSaving(true);
    await StorageService.saveSurvey(survey);
    setSaving(false);
    lastSavedRef.current = Date.now();
  }, [survey]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastSavedRef.current > 5000) {
        save();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [save]);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: 'q' + Date.now(),
      type,
      title: 'New Question',
      mandatory: true,
      options: type !== QuestionType.RATING ? [
        { id: 'opt1', text: 'Option 1' },
        { id: 'opt2', text: 'Option 2' }
      ] : undefined
    };
    setSurvey(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
  };

  const updateQuestion = (qId: string, updates: Partial<Question>) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
    }));
  };

  const deleteQuestion = (qId: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== qId)
    }));
  };

  const applyBulkPaste = () => {
    if (!bulkPasteTarget) return;
    const lines = bulkText.split('\n').filter(l => l.trim());
    const newOptions: Option[] = lines.map((l, i) => ({ id: `opt-${Date.now()}-${i}`, text: l.trim() }));
    updateQuestion(bulkPasteTarget, { options: newOptions });
    setBulkPasteTarget(null);
    setBulkText('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Bulk Paste Modal */}
      {bulkPasteTarget && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Batch Import Options</h3>
            <p className="text-sm text-gray-500">Paste your options below. Each line will become a separate option.</p>
            <textarea 
              className="w-full h-48 border-gray-200 rounded-xl focus:ring-indigo-500 text-sm"
              placeholder="Beijing&#10;Shanghai&#10;Guangzhou&#10;Shenzhen"
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setBulkPasteTarget(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition">Cancel</button>
              <button onClick={applyBulkPaste} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">Import Options</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ICONS.ArrowLeft />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {surveyId ? 'Edit Survey' : 'New Survey'}
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-400">
            {saving ? 'Saving...' : 'All changes saved'}
          </span>
          <button 
            onClick={() => navigate('viewer', { id: survey.id, preview: true })}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center"
          >
            <ICONS.Eye />
            <span className="ml-2">Preview</span>
          </button>
          <button 
            onClick={async () => {
              // FIX: Await saveSurvey when publishing
              const updated = { ...survey, status: SurveyStatus.PUBLISHED };
              setSurvey(updated);
              await StorageService.saveSurvey(updated);
              navigate('dashboard');
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('content')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === 'content' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Content Editor
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Settings
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'content' ? (
            <div className="space-y-8">
              <div className="space-y-4">
                <input 
                  type="text"
                  placeholder="Survey Title"
                  value={survey.title}
                  onChange={e => setSurvey({ ...survey, title: e.target.value })}
                  className="w-full text-3xl font-bold border-none focus:ring-0 placeholder-gray-300"
                />
                <RichTextEditor
                  value={survey.description}
                  onChange={val => setSurvey({ ...survey, description: val })}
                  placeholder="Add a detailed description for your participants..."
                />
              </div>

              <div className="space-y-6">
                {survey.questions.map((q, qIndex) => (
                  <div key={q.id} className="group relative bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-indigo-200 transition">
                    <button 
                      onClick={() => deleteQuestion(q.id)}
                      className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                    >
                      <ICONS.Trash />
                    </button>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-bold text-indigo-600">Q{qIndex + 1}</span>
                        <input 
                          type="text"
                          value={q.title}
                          onChange={e => updateQuestion(q.id, { title: e.target.value })}
                          className="flex-grow bg-transparent font-medium border-none focus:ring-0"
                          placeholder="Question Title"
                        />
                      </div>

                      {q.type !== QuestionType.RATING && q.options && (
                        <div className="ml-8 space-y-2">
                          {q.options.map((opt, oIndex) => (
                            <div key={opt.id} className="flex items-center space-x-2">
                              <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                              <input 
                                type="text"
                                value={opt.text}
                                onChange={e => {
                                  const newOpts = [...q.options!];
                                  newOpts[oIndex].text = e.target.value;
                                  updateQuestion(q.id, { options: newOpts });
                                }}
                                className="flex-grow text-sm bg-transparent border-none focus:ring-0 py-1"
                              />
                              {q.type === QuestionType.SINGLE_CHOICE && (
                                <select 
                                  className="text-[10px] bg-white border border-gray-200 rounded px-1"
                                  value={opt.skipToQuestionId || ''}
                                  onChange={e => {
                                    const newOpts = [...q.options!];
                                    newOpts[oIndex].skipToQuestionId = e.target.value || undefined;
                                    updateQuestion(q.id, { options: newOpts });
                                  }}
                                >
                                  <option value="">Next Question</option>
                                  {survey.questions.map((sq, i) => i > qIndex && (
                                    <option key={sq.id} value={sq.id}>Skip to Q{i + 1}</option>
                                  ))}
                                  <option value="END">End Survey</option>
                                </select>
                              )}
                            </div>
                          ))}
                          <div className="flex items-center space-x-4 pt-2">
                            <button 
                              onClick={() => {
                                const newOpts = [...q.options!, { id: 'opt' + Date.now(), text: `Option ${q.options!.length + 1}` }];
                                updateQuestion(q.id, { options: newOpts });
                              }}
                              className="text-xs text-indigo-600 hover:underline font-medium"
                            >
                              + Add Option
                            </button>
                            <button 
                              onClick={() => setBulkPasteTarget(q.id)}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              Batch Paste
                            </button>
                          </div>
                        </div>
                      )}

                      {q.type === QuestionType.RATING && (
                        <div className="ml-8 flex space-x-2">
                          {[1,2,3,4,5].map(s => <ICONS.Star key={s} filled={false} />)}
                        </div>
                      )}

                      <div className="flex items-center space-x-6 ml-8 pt-2">
                        <label className="flex items-center space-x-2 text-xs text-gray-500">
                          <input 
                            type="checkbox" 
                            checked={q.mandatory} 
                            onChange={e => updateQuestion(q.id, { mandatory: e.target.checked })} 
                            className="rounded text-indigo-600"
                          />
                          <span>Mandatory</span>
                        </label>
                        {q.type !== QuestionType.RATING && (
                          <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-2 text-xs text-gray-500">
                              <input 
                                type="checkbox" 
                                checked={q.hasOther} 
                                onChange={e => updateQuestion(q.id, { hasOther: e.target.checked, otherLabel: e.target.checked ? (q.otherLabel || 'Other') : undefined })} 
                                className="rounded text-indigo-600"
                              />
                              <span>Include "Other"</span>
                            </label>
                            {q.hasOther && (
                              <input 
                                type="text"
                                value={q.otherLabel || 'Other'}
                                onChange={e => updateQuestion(q.id, { otherLabel: e.target.value })}
                                className="text-[10px] border-gray-200 rounded px-2 py-0.5 focus:ring-indigo-500 w-32"
                                placeholder="e.g. Other reasons"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => addQuestion(QuestionType.SINGLE_CHOICE)} className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"><ICONS.Plus /> <span className="ml-2">Single Choice</span></button>
                  <button onClick={() => addQuestion(QuestionType.MULTIPLE_CHOICE)} className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"><ICONS.Plus /> <span className="ml-2">Multiple Choice</span></button>
                  <button onClick={() => addQuestion(QuestionType.RATING)} className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"><ICONS.Plus /> <span className="ml-2">Rating</span></button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 max-w-2xl">
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 border-b pb-2">Privacy & Accessibility</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Anonymous Survey</p>
                      <p className="text-xs text-gray-500">Don't record participant IDs.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={survey.config.isAnonymous}
                      onChange={e => setSurvey({ ...survey, config: { ...survey.config, isAnonymous: e.target.checked } })}
                      className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Allow Multiple Submissions</p>
                      <p className="text-xs text-gray-500">Users can submit more than once.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={survey.config.allowMultipleSubmissions}
                      onChange={e => setSurvey({ ...survey, config: { ...survey.config, allowMultipleSubmissions: e.target.checked } })}
                      className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 border-b pb-2">Timeline & Limits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Time</label>
                    <input 
                      type="datetime-local"
                      value={survey.config.startTime || ''}
                      onChange={e => setSurvey({ ...survey, config: { ...survey.config, startTime: e.target.value } })}
                      className="w-full border-gray-200 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">End Time</label>
                    <input 
                      type="datetime-local"
                      value={survey.config.endTime || ''}
                      onChange={e => setSurvey({ ...survey, config: { ...survey.config, endTime: e.target.value } })}
                      className="w-full border-gray-200 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Max Participants</label>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="number"
                        value={survey.config.maxParticipants || ''}
                        onChange={e => setSurvey({ ...survey, config: { ...survey.config, maxParticipants: parseInt(e.target.value) || undefined } })}
                        className="flex-grow border-gray-200 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. 100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 border-b pb-2">Status Management</h4>
                <div className="flex items-center space-x-4">
                  <select 
                    value={survey.status}
                    onChange={e => setSurvey({ ...survey, status: e.target.value as SurveyStatus })}
                    className="flex-grow border-gray-200 rounded-xl text-sm"
                  >
                    <option value={SurveyStatus.DRAFT}>Draft</option>
                    <option value={SurveyStatus.PUBLISHED}>Published</option>
                    <option value={SurveyStatus.CLOSED}>Closed</option>
                    <option value={SurveyStatus.ARCHIVED}>Archived</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyEditor;
