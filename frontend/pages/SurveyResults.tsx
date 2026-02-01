
import React, { useState, useEffect, useMemo } from 'react';
import { Survey, SurveyResponse, User, QuestionType } from '../types';
import { StorageService } from '../services/storageService';
import { ICONS, MOCK_USERS } from '../constants.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SurveyResultsProps {
  user: User;
  surveyId: string;
  navigate: (view: string, params?: any) => void;
}

const SurveyResults: React.FC<SurveyResultsProps> = ({ user, surveyId, navigate }) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  
  // Lottery state
  const [lotteryWinners, setLotteryWinners] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // FIX: Await asynchronous survey and response data
    const loadData = async () => {
      const s = await StorageService.getSurveyById(surveyId);
      if (s) setSurvey(s);
      const resps = await StorageService.getResponsesBySurveyId(surveyId);
      setResponses(resps);
    };
    loadData();
  }, [surveyId]);

  const stats = useMemo(() => {
    if (!survey || responses.length === 0) return [];
    
    return survey.questions.map(q => {
      const data: any[] = [];
      if (q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE) {
        q.options?.forEach(opt => {
          const count = responses.filter(r => {
            const ans = r.answers[q.id];
            return Array.isArray(ans) ? ans.includes(opt.text) : ans === opt.text;
          }).length;
          data.push({ name: opt.text, count });
        });
      } else if (q.type === QuestionType.RATING) {
        [1,2,3,4,5].forEach(star => {
          const count = responses.filter(r => r.answers[q.id] === star).length;
          data.push({ name: `${star} Star`, count });
        });
      }
      return { qId: q.id, title: q.title, data };
    });
  }, [survey, responses]);

  const handleLottery = () => {
    if (responses.length === 0) return;
    setIsDrawing(true);
    setTimeout(() => {
      const eligible = responses
        .map(r => r.userId)
        .filter(uid => uid !== 'anonymous');
      
      const uniqueParticipants = Array.from(new Set(eligible));
      const winners: string[] = [];
      const temp = [...uniqueParticipants];
      
      for (let i = 0; i < Math.min(3, temp.length); i++) {
        const idx = Math.floor(Math.random() * temp.length);
        const winnerId = temp.splice(idx, 1)[0];
        const winnerName = MOCK_USERS.find(u => u.id === winnerId)?.name || 'Unknown';
        winners.push(winnerName);
      }
      
      setLotteryWinners(winners);
      setIsDrawing(false);
    }, 2000);
  };

  const exportToExcel = () => {
    if (!survey || responses.length === 0) return;

    // Build CSV Content
    const headers = ['Response ID', 'Timestamp', 'User', ...survey.questions.map(q => q.title)];
    const rows = responses.map(r => {
      const row = [
        r.id,
        new Date(r.submittedAt).toISOString(),
        survey.config.isAnonymous ? 'Anonymous' : (MOCK_USERS.find(u => u.id === r.userId)?.name || r.userId),
        ...survey.questions.map(q => {
          const ans = r.answers[q.id];
          return Array.isArray(ans) ? ans.join('; ') : (ans || '');
        })
      ];
      return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${survey.title.replace(/\s+/g, '_')}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!survey) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ICONS.ArrowLeft />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Survey Results</h2>
            <p className="text-gray-500">Analytics for {survey.title}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={exportToExcel} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            <ICONS.Download />
            <span className="ml-2">Export CSV</span>
          </button>
          <button onClick={handleLottery} className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium">
            <ICONS.Gift />
            <span className="ml-2">Run Lottery</span>
          </button>
        </div>
      </div>

      {isDrawing && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center animate-pulse">
          <p className="text-amber-800 font-bold text-xl">Drawing winners from {responses.length} participants...</p>
        </div>
      )}

      {lotteryWinners.length > 0 && !isDrawing && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-4 shadow-inner">
          <h3 className="text-xl font-bold text-amber-900">🎉 Congratulations to our Winners! 🎉</h3>
          <div className="flex justify-center space-x-8">
            {lotteryWinners.map((w, i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 w-40 transform hover:scale-105 transition">
                <p className="text-xs text-amber-500 font-bold uppercase mb-1">Winner {i+1}</p>
                <p className="text-lg font-bold text-gray-900">{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {stats.map(s => (
          <div key={s.qId} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h4 className="text-lg font-bold text-gray-900 mb-6">{s.title}</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.data} layout="vertical" margin={{ left: 30, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} fontSize={12} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {s.data.map((entry, index) => (
                      <Cell key={index} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SurveyResults;
