
import React, { useState, useEffect } from 'react';
import { User, Survey, SurveyResponse } from '../types';
import { StorageService } from '../services/storageService';
import { ICONS } from '../constants.tsx';

interface MyParticipationsProps {
  user: User;
  navigate: (view: string, params?: any) => void;
}

const MyParticipations: React.FC<MyParticipationsProps> = ({ user, navigate }) => {
  const [responses, setResponses] = useState<(SurveyResponse & { survey?: Survey })[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // FIX: StorageService methods are asynchronous. Await the results within an async function.
    const loadData = async () => {
      setLoading(true);
      const responsePage = await StorageService.getResponsesByUserIdPage(user.id, { page, size: pageSize });
      if (responsePage.totalPages === 0 && page !== 0) {
        setPage(0);
        setLoading(false);
        return;
      }

      if (responsePage.totalPages > 0 && page >= responsePage.totalPages) {
        setPage(Math.max(0, responsePage.totalPages - 1));
        setLoading(false);
        return;
      }

      setTotalPages(responsePage.totalPages);
      setTotalElements(responsePage.totalElements);

      const surveyIds = Array.from(new Set(responsePage.items.map(r => r.surveyId)));
      const surveys = surveyIds.length
        ? await StorageService.getSurveys({ ids: surveyIds, allPages: true })
        : [];
      const surveyMap = new Map(surveys.map(s => [s.id, s]));

      const enriched = responsePage.items.map(r => ({
        ...r,
        survey: surveyMap.get(r.surveyId)
      }));
      
      setResponses(enriched);
      setLoading(false);
    };
    loadData();
  }, [user.id, page, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [user.id, pageSize]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Participation History</h2>
        <p className="text-gray-500">Track and view your previous survey contributions.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Survey Title</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Submitted At</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {responses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-gray-400">
                  {loading ? 'Loading responses...' : "You haven't participated in any surveys yet."}
                </td>
              </tr>
            ) : (
              responses.map(res => (
                <tr key={res.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{res.survey?.title || 'Unknown Survey'}</p>
                    <p className="text-xs text-gray-500">{res.survey?.description || ''}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(res.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-[10px] font-bold bg-green-100 text-green-700 rounded-full">SUBMITTED</span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => navigate('viewer', { id: res.surveyId, responseId: res.id, from: 'my-surveys' })}
                      className="text-indigo-600 font-medium hover:underline text-sm"
                    >
                      {res.survey?.config.allowEditAfterSubmit ? 'View/Update' : 'View'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-gray-500">
          {totalElements === 0
            ? 'No responses'
            : `Showing ${page * pageSize + 1}-${Math.min(totalElements, (page + 1) * pageSize)} of ${totalElements}`}
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600"
            title="Page size"
          >
            {[5, 10, 20, 50].map(size => (
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

export default MyParticipations;
