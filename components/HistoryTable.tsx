import React, { useState, useMemo } from 'react';
import { Download, FileText, Calendar, User, BookOpen, Search, Filter, ShieldCheck, Edit2, Trash2, Clock, Tag } from 'lucide-react';
import { Report, SubjectType, SUBJECT_TOPICS, CategoryType } from '../types';
import { downloadCSV } from '../services/storage';

interface HistoryTableProps {
  tutorName: string;
  reports: Report[];
  isAdmin?: boolean;
  onEdit?: (report: Report) => void;
  onDelete?: (id: string) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ 
  tutorName, 
  reports, 
  isAdmin = false,
  onEdit,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredReports = useMemo(() => {
    let data = isAdmin ? reports : reports.filter(r => r.tutorName === tutorName);

    if (filterCategory !== 'all') {
      data = data.filter(r => (r.category || '輔導') === filterCategory);
    }

    if (filterSubject !== 'all') {
      data = data.filter(r => r.subject === filterSubject);
    }

    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(r => 
        r.studentName.toLowerCase().includes(lowerTerm) ||
        (isAdmin && r.tutorName.toLowerCase().includes(lowerTerm)) ||
        r.details.toLowerCase().includes(lowerTerm)
      );
    }

    return data;
  }, [reports, isAdmin, tutorName, searchTerm, filterSubject, filterCategory]);

  const handleExport = () => {
    const prefix = isAdmin ? 'admin_all_reports' : `tutor_reports_${tutorName}`;
    downloadCSV(filteredReports, prefix);
  };

  const handleDeleteClick = (id: string) => {
    if (onDelete) onDelete(id);
  };

  if (!isAdmin && filteredReports.length === 0 && !searchTerm && filterSubject === 'all' && filterCategory === 'all') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">尚無回報紀錄</h3>
        <p className="text-gray-500">請提交您的第一份回報。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-6 h-6 text-indigo-600" />
                  <span>系統總回報列表</span>
                </>
              ) : (
                '歷史回報紀錄'
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isAdmin 
                ? `管理員模式 - 共篩選出 ${filteredReports.length} 筆資料` 
                : `老師：${tutorName} (共 ${filteredReports.length} 筆)`
              }
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={filteredReports.length === 0}
            className={`flex items-center justify-center space-x-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${
              filteredReports.length === 0 
                ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed' 
                : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>匯出 CSV</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="搜尋學生、內容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white sm:text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
            >
              <option value="all">所有類別</option>
              <option value="輔導">輔導</option>
              <option value="補課">補課</option>
            </select>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
            >
              <option value="all">所有科目</option>
              {Object.keys(SUBJECT_TOPICS).map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-24">日期</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-24 text-center">類別</th>
              {isAdmin && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-24">導師</th>}
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-24">學生</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-32">科目/重點</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">內容詳情</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-20 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap align-top text-sm text-gray-600">
                    {report.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-top text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                      (report.category || '輔導') === '補課' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {(report.category || '輔導') === '補課' ? <Clock className="w-3 h-3 mr-1" /> : <Tag className="w-3 h-3 mr-1" />}
                      {report.category || '輔導'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                      <div className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded inline-block">{report.tutorName}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap align-top font-medium text-gray-900 text-sm">
                    {report.studentName}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col space-y-1">
                      <div className="text-sm font-medium text-gray-700">{report.subject}</div>
                      <div className="flex flex-wrap gap-1">
                        {report.topics.map((topic, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3 hover:line-clamp-none transition-all">
                      {report.details}
                    </p>
                  </td>
                  <td className="px-6 py-4 align-top text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {!isAdmin && onEdit && (
                        <button onClick={() => onEdit(report)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      )}
                      {onDelete && (
                        <button onClick={() => handleDeleteClick(report.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-500">沒有符合條件的資料</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};