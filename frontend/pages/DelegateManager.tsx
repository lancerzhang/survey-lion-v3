
import React, { useState, useEffect } from 'react';
import { User, Delegation, Survey } from '../types';
import { StorageService } from '../services/storageService';
import { MOCK_USERS, ICONS } from '../constants.tsx';

interface DelegateManagerProps {
  user: User;
  navigate: (view: string, params?: any) => void;
}

const DelegateManager: React.FC<DelegateManagerProps> = ({ user, navigate }) => {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  
  // New delegation form
  const [targetUserId, setTargetUserId] = useState('');
  const [surveyId, setSurveyId] = useState('');
  const [permissions, setPermissions] = useState<('CREATE' | 'EDIT' | 'VIEW_RESULTS')[]>(['VIEW_RESULTS']);

  useEffect(() => {
    setDelegations(StorageService.getDelegations().filter(d => d.ownerId === user.id));
    setSurveys(StorageService.getSurveys().filter(s => s.ownerId === user.id));
  }, [user.id]);

  const handleAdd = () => {
    if (!targetUserId) return;
    const newDel: Delegation = {
      id: 'd' + Date.now(),
      ownerId: user.id,
      delegateId: targetUserId,
      surveyId: surveyId || undefined,
      permissions
    };
    StorageService.saveDelegation(newDel);
    setDelegations([...delegations, newDel]);
    setTargetUserId('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Delegation Center</h2>
        <p className="text-gray-500">Authorize others to help manage your surveys or view results.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900">Add New Delegate</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Delegate User</label>
              <select 
                value={targetUserId}
                onChange={e => setTargetUserId(e.target.value)}
                className="w-full border-gray-200 rounded-lg text-sm"
              >
                <option value="">Select a colleague...</option>
                {MOCK_USERS.filter(u => u.id !== user.id).map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Scope</label>
              <select 
                value={surveyId}
                onChange={e => setSurveyId(e.target.value)}
                className="w-full border-gray-200 rounded-lg text-sm"
              >
                <option value="">Global Access (All Surveys)</option>
                {surveys.map(s => (
                  <option key={s.id} value={s.id}>Specific Survey: {s.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Permissions</label>
              <div className="space-y-2">
                {['CREATE', 'EDIT', 'VIEW_RESULTS'].map(p => (
                  <label key={p} className="flex items-center space-x-2 text-sm text-gray-700">
                    <input 
                      type="checkbox" 
                      checked={permissions.includes(p as any)}
                      onChange={e => {
                        if (e.target.checked) setPermissions([...permissions, p as any]);
                        else setPermissions(permissions.filter(perm => perm !== p));
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={handleAdd}
              disabled={!targetUserId}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold disabled:opacity-50 transition"
            >
              Grant Access
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Colleague</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Survey Scope</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Permissions</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {delegations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400">No active delegations.</td>
                  </tr>
                ) : (
                  delegations.map(del => {
                    const delegateUser = MOCK_USERS.find(u => u.id === del.delegateId);
                    const scopeSurvey = surveys.find(s => s.id === del.surveyId);
                    return (
                      <tr key={del.id}>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{delegateUser?.name}</p>
                          <p className="text-xs text-gray-500">{delegateUser?.email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {scopeSurvey ? `Survey: ${scopeSurvey.title}` : 'Global'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {del.permissions.map(p => (
                              <span key={p} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">{p}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-red-500 hover:text-red-700"><ICONS.Trash /></button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelegateManager;
