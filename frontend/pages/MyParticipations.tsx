
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

  useEffect(() => {
    const allResponses = StorageService.getResponses();
    const userResponses = allResponses.filter(r => r.userId === user.id);
    
    const enriched = userResponses.map(r => ({
      ...r,
      survey: StorageService.getSurveyById(r.surveyId)
    }));
    
    setResponses(enriched);
  }, [user.id]);

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
                <td colSpan={4} className="px-6 py-20 text-center text-gray-400">You haven't participated in any surveys yet.</td>
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
                      onClick={() => navigate('viewer', { id: res.surveyId })}
                      className="text-indigo-600 font-medium hover:underline text-sm"
                    >
                      View/Update
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyParticipations;
