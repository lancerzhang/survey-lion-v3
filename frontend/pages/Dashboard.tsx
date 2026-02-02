
import React, { useState, useEffect } from 'react';
import { Survey, User, SurveyStatus } from '../types';
import { StorageService } from '../services/storageService';
import { ICONS, SURVEY_TEMPLATES } from '../constants.tsx';

interface DashboardProps {
  user: User;
  navigate: (view: string, params?: any) => void;
  refresh: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user, navigate, refresh }) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [filter, setFilter] = useState<'ALL' | SurveyStatus>('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // FIX: StorageService methods are asynchronous. Await the results within an async function.
    const fetchData = async () => {
      setLoading(true);
      const delegations = StorageService.getDelegationsForUser(user.id);
      const globalOwnerIds = delegations.filter(d => !d.surveyId).map(d => d.ownerId);
      const ownerIds = Array.from(new Set([user.id, ...globalOwnerIds]));
      const scopedSurveyIds = delegations
        .map(d => d.surveyId)
        .filter((id): id is string => Boolean(id));
      const statuses = filter === 'ALL' ? undefined : [filter];
      const result = await StorageService.getSurveysPage({
        ownerIds: user.role === 'ADMIN' ? undefined : ownerIds,
        ids: user.role === 'ADMIN' ? undefined : scopedSurveyIds,
        statuses,
        page,
        size: pageSize
      });

      const accessible = result.items;

      if (result.totalPages === 0 && page !== 0) {
        setPage(0);
        setLoading(false);
        return;
      }

      if (result.totalPages > 0 && page >= result.totalPages) {
        setPage(Math.max(0, result.totalPages - 1));
        setLoading(false);
        return;
      }

      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);

      const counts = accessible.length > 0
        ? await StorageService.getResponseCountsBySurveyIds(accessible.map(s => s.id))
        : {};
      setResponseCounts(counts);

      setSurveys(accessible.sort((a, b) => b.updatedAt - a.updatedAt));
      setLoading(false);
    };
    fetchData();
  }, [user.id, refresh, filter, page, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [filter, user.id, refresh, pageSize]);

  // FIX: Make handleDelete async to await survey deletion
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this survey? All responses will be lost.')) {
      await StorageService.deleteSurvey(id);
      setSurveys(prev => prev.filter(s => s.id !== id));
    }
  };

  // FIX: Make handleArchive async to await survey saving
  const handleArchive = async (survey: Survey) => {
    const updated = { ...survey, status: SurveyStatus.ARCHIVED };
    await StorageService.saveSurvey(updated);
    setSurveys(prev => prev.map(s => s.id === survey.id ? updated : s));
  };

  // FIX: Make createFromTemplate async to await survey saving
  const createFromTemplate = async (template?: Partial<Survey>) => {
    const newId = 's' + Date.now();
    const newSurvey: Survey = {
      id: newId,
      ownerId: user.id,
      title: template?.title || 'Untitled Survey',
      description: template?.description || '',
      status: SurveyStatus.DRAFT,
      questions: template?.questions || [],
      config: {
        isAnonymous: false,
        allowEditAfterSubmit: false,
        allowMultipleSubmissions: false,
        startTime: '',
        endTime: '',
        maxParticipants: undefined
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await StorageService.saveSurvey(newSurvey);
    navigate('editor', { id: newId });
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <div className="space-y-8">
      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Choose a Template</h3>
                <p className="text-gray-500">Get started quickly with a pre-built survey structure.</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                title="Close"
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                &times;
              </button>
            </div>
            <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button 
                onClick={() => createFromTemplate()}
                className="flex flex-col text-left p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition group"
              >
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <ICONS.Plus />
                </div>
                <h4 className="font-bold text-gray-900">Blank Survey</h4>
                <p className="text-xs text-gray-400 mt-2">Start from scratch and build your own unique questionnaire.</p>
              </button>
              {SURVEY_TEMPLATES.map((tpl, i) => (
                <button 
                  key={i}
                  onClick={() => createFromTemplate(tpl)}
                  className="flex flex-col text-left p-6 bg-white border border-gray-200 rounded-2xl hover:border-indigo-400 hover:shadow-lg transition group"
                >
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <ICONS.Edit />
                  </div>
                  <h4 className="font-bold text-gray-900">{tpl.title}</h4>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{tpl.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Survey Management</h2>
          <div className="flex items-center space-x-4 mt-2">
            {['ALL', SurveyStatus.DRAFT, SurveyStatus.PUBLISHED, SurveyStatus.CLOSED, SurveyStatus.ARCHIVED].map(st => (
              <button 
                key={st}
                onClick={() => setFilter(st as any)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${filter === st ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={() => setShowTemplateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium"
        >
          <ICONS.Plus />
          <span className="ml-2">Create New</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {surveys.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white">
            <h3 className="text-lg font-medium text-gray-900">
              {loading ? 'Loading surveys...' : 'No surveys matching filters'}
            </h3>
          </div>
        ) : (
          surveys.map(survey => (
            <div key={survey.id} className={`bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group p-6 flex flex-col h-full ${survey.status === SurveyStatus.ARCHIVED ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  survey.status === SurveyStatus.DRAFT ? 'bg-amber-100 text-amber-700' : 
                  survey.status === SurveyStatus.PUBLISHED ? 'bg-green-100 text-green-700' : 
                  survey.status === SurveyStatus.CLOSED ? 'bg-red-100 text-red-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {survey.status}
                </span>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleArchive(survey)}
                    title="Archive"
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                  >
                    <ICONS.Archive />
                  </button>
                  <button
                    onClick={() => handleDelete(survey.id)}
                    title="Delete"
                    className="p-1.5 hover:bg-red-50 rounded text-red-500"
                  >
                    <ICONS.Trash />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{survey.title}</h3>
              <p className="text-sm text-gray-500 mb-6 line-clamp-2 flex-grow">
                {stripHtml(survey.description) || 'No description provided.'}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="text-xs text-gray-400">
                  {/* FIX: Use cached response counts from state instead of calling async method synchronously */}
                  {responseCounts[survey.id] || 0} Responses
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => navigate('editor', { id: survey.id })}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Edit"
                  >
                    <ICONS.Edit />
                  </button>
                  <button
                    onClick={() => navigate('results', { id: survey.id })}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Results"
                  >
                    <ICONS.Chart />
                  </button>
                  <button
                    onClick={() => navigate('viewer', { id: survey.id })}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="View"
                  >
                    <ICONS.Eye />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-gray-500">
          {totalElements === 0
            ? 'No surveys'
            : `Showing ${page * pageSize + 1}-${Math.min(totalElements, (page + 1) * pageSize)} of ${totalElements}`}
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600"
            title="Page size"
          >
            {[6, 9, 12, 18].map(size => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page <= 0 || loading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-gray-500">
            Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
