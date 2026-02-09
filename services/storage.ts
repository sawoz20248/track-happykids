import { Report } from '../types';

const STORAGE_KEY = 'tutor_reports_v1';

// Helper for ID generation
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const getReports = (): Report[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsedReports = JSON.parse(stored);
    
    // Migration: Check for missing IDs and backfill if necessary
    let hasUpdates = false;
    const reports = parsedReports.map((r: any) => {
      if (!r.id) {
        hasUpdates = true;
        return { ...r, id: generateId() };
      }
      return r;
    });

    // Save backfilled IDs to ensure persistence
    if (hasUpdates) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    }

    return reports;
  } catch (error) {
    console.error("Failed to load reports", error);
    return [];
  }
};

export const saveReport = (report: Report): void => {
  const reports = getReports();
  if (!report.id) report.id = generateId();
  
  const updatedReports = [report, ...reports];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));
};

export const updateReport = (updatedReport: Report): void => {
  const reports = getReports();
  const newReports = reports.map(r => r.id === updatedReport.id ? updatedReport : r);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newReports));
};

export const deleteReport = (id: string): void => {
  const reports = getReports();
  const newReports = reports.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newReports));
};

export const downloadCSV = (reports: Report[], fileNamePrefix: string) => {
  if (reports.length === 0) return;

  const headers = ['日期', '導師姓名', '類別', '學生姓名', '科目', '內容重點', '詳細內容', '提交時間'];
  const rows = reports.map(r => [
    r.date,
    r.tutorName,
    r.category || '輔導', // Default to 輔導 for old data
    r.studentName,
    r.subject,
    `"${r.topics.join(', ')}"`, 
    `"${r.details.replace(/"/g, '""')}"`, 
    new Date(r.timestamp).toLocaleString('zh-TW')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileNamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};