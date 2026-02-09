import React, { useState } from 'react';
import { UserCircle, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onLogin: (name: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all hover:scale-[1.01]">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-100 rounded-full">
            <UserCircle className="w-12 h-12 text-indigo-600" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">輔導老師回報系統</h2>
        <p className="text-center text-gray-500 mb-8">請登入以開始使用</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              老師姓名
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="請輸入您的姓名"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span>登入系統</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
      <p className="mt-6 text-sm text-gray-400">TutorTrack System v1.0</p>
    </div>
  );
};