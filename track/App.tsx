import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { ReportForm } from './components/ReportForm';
import { HistoryTable } from './components/HistoryTable';
import { Report } from './types';
import { getReports, deleteReport } from './services/storage';
import { LogOut, BookOpenCheck, Shield, Edit, Info } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  // Initialize session from simple storage persistence or just state
  useEffect(() => {
    const storedUser = localStorage.getItem('tutor_user');
    if (storedUser) setUser(storedUser);
    
    // Load reports
    setReports(getReports());
  }, []);

  const handleLogin = (name: string) => {
    setUser(name);
    localStorage.setItem('tutor_user', name);
  };

  const handleLogout = () => {
    setUser(null);
    setEditingReport(null);
    localStorage.removeItem('tutor_user');
  };

  const refreshReports = () => {
    setReports(getReports());
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    // On mobile, smooth scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingReport(null);
  };

  const handleDelete = (id: string) => {
    deleteReport(id);
    refreshReports();
    // If deleting the currently edited report, cancel edit mode
    if (editingReport?.id === id) {
      setEditingReport(null);
    }
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const isAdmin = user === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 pb-12 transition-all duration-300">
      {/* Navbar */}
      <nav className={`${isAdmin ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-50 transition-colors duration-300 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className={`${isAdmin ? 'bg-indigo-500' : 'bg-indigo-600'} p-2 rounded-xl mr-3 shadow-md`}>
                {isAdmin ? <Shield className="w-6 h-6 text-white" /> : <BookOpenCheck className="w-6 h-6 text-white" />}
              </div>
              <span className={`text-xl font-extrabold tracking-tight ${isAdmin ? 'text-white' : 'text-gray-900'}`}>
                {isAdmin ? 'TutorTrack Admin' : '輔導老師回報系統'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-sm hidden md:flex flex-col items-end ${isAdmin ? 'text-gray-300' : 'text-gray-500'}`}>
                <span className="text-[10px] uppercase font-bold opacity-60">當前登入</span>
                <span className={`font-bold ${isAdmin ? 'text-white' : 'text-gray-900'}`}>{user}</span>
              </div>
              <button
                onClick={handleLogout}
                className={`p-2.5 rounded-xl transition-all ${
                  isAdmin 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-red-400' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-red-600 bg-gray-50'
                }`}
                title="登出"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Edit Mode Alert Banner */}
        {editingReport && (
          <div className="mb-8 p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn border-l-8 border-indigo-400">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">正在編輯模式</h3>
                <p className="text-xs text-indigo-100 opacity-90">修改學生：<span className="font-bold underline">{editingReport.studentName}</span> 的紀錄</p>
              </div>
            </div>
            <button 
              onClick={handleCancelEdit}
              className="px-6 py-2 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
            >
              取消編輯
            </button>
          </div>
        )}

        {isAdmin ? (
          <div className="w-full animate-fadeIn">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 text-blue-700">
              <Info className="w-5 h-5" />
              <p className="text-sm font-medium">管理員模式：您可以查看並管理所有老師的回報紀錄。</p>
            </div>
            <HistoryTable 
              tutorName={user} 
              reports={reports}
              isAdmin={true}
              onDelete={handleDelete}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fadeIn">
            {/* Left Column: Form */}
            <div className="lg:col-span-5 space-y-6">
              <ReportForm 
                tutorName={user} 
                onReportSubmitted={refreshReports}
                initialData={editingReport}
                onCancelEdit={handleCancelEdit}
              />
            </div>

            {/* Right Column: History */}
            <div className="lg:col-span-7">
              <HistoryTable 
                tutorName={user} 
                reports={reports}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;