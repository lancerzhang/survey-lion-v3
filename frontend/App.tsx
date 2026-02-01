
import React, { useState, useEffect, useMemo } from 'react';
import { User, Survey, SurveyStatus } from './types';
import { MOCK_USERS, APP_NAME, ICONS } from './constants';
import { StorageService } from './services/storageService';

// Pages
import Dashboard from './pages/Dashboard';
import SurveyEditor from './pages/SurveyEditor';
import SurveyViewer from './pages/SurveyViewer';
import SurveyResults from './pages/SurveyResults';
import MyParticipations from './pages/MyParticipations';
import DelegateManager from './pages/DelegateManager';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [view, setView] = useState<{ name: string; params?: any }>({ name: 'dashboard' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Simple routing based on state
  const navigate = (name: string, params?: any) => {
    setView({ name, params });
  };

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const renderContent = () => {
    switch (view.name) {
      case 'dashboard':
        return <Dashboard user={currentUser} navigate={navigate} refresh={refreshTrigger} />;
      case 'editor':
        return <SurveyEditor user={currentUser} surveyId={view.params?.id} navigate={navigate} />;
      case 'viewer':
        return <SurveyViewer user={currentUser} surveyId={view.params?.id} navigate={navigate} preview={view.params?.preview} />;
      case 'results':
        return <SurveyResults user={currentUser} surveyId={view.params?.id} navigate={navigate} />;
      case 'my-surveys':
        return <MyParticipations user={currentUser} navigate={navigate} />;
      case 'delegates':
        return <DelegateManager user={currentUser} navigate={navigate} />;
      default:
        return <Dashboard user={currentUser} navigate={navigate} refresh={refreshTrigger} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('dashboard')}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">{APP_NAME}</h1>
          </div>

          <nav className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('my-surveys')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${view.name === 'my-surveys' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Responses
            </button>
            <button 
              onClick={() => navigate('delegates')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${view.name === 'delegates' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Delegation
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 hidden md:block">Acting as</span>
              <select 
                value={currentUser.id}
                onChange={(e) => {
                  const user = MOCK_USERS.find(u => u.id === e.target.value);
                  if (user) {
                    setCurrentUser(user);
                    triggerRefresh();
                  }
                }}
                className="text-sm font-medium border-none focus:ring-0 bg-transparent text-gray-900 cursor-pointer"
              >
                {MOCK_USERS.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-sm">
          &copy; 2024 Survey Lion v3. Internal Enterprise Tool.
        </div>
      </footer>
    </div>
  );
};

export default App;
