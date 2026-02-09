
import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, CheckCircle, GraduationCap, Plus, Save, X, BookOpen, Clock, Edit3, Camera, Upload, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { SubjectType, SUBJECT_TOPICS, MAKEUP_TOPICS, Report, CategoryType } from '../types';
import { saveReport, updateReport } from '../services/storage';
import { GoogleGenAI } from "@google/genai";

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

interface ReportFormProps {
  tutorName: string;
  onReportSubmitted: () => void;
  initialData?: Report | null;
  onCancelEdit?: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({ 
  tutorName, 
  onReportSubmitted, 
  initialData, 
  onCancelEdit 
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<CategoryType>('輔導');
  const [studentName, setStudentName] = useState('');
  const [subject, setSubject] = useState<SubjectType>('英文');
  const [topics, setTopics] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  
  const [customTopic, setCustomTopic] = useState('');
  const [extraTopics, setExtraTopics] = useState<string[]>([]);

  // AI & Image Scan States
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setCategory(initialData.category || '輔導');
      setStudentName(initialData.studentName);
      setSubject(initialData.subject);
      setDetails(initialData.details);
      
      const defaultOptions = initialData.category === '補課' 
        ? MAKEUP_TOPICS 
        : (SUBJECT_TOPICS[initialData.subject] || []);
      
      const custom = initialData.topics.filter(t => !defaultOptions.includes(t));
      setExtraTopics(custom);
      setTopics(initialData.topics);
      
      setError(null);
      setSuccess(false);
    } else {
      setCategory('輔導');
      setStudentName('');
      setTopics([]);
      setExtraTopics([]);
      setDetails('');
      setCapturedImage(null);
    }
  }, [initialData]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleCategoryChange = (newCat: CategoryType) => {
    setCategory(newCat);
    setTopics([]);
    setExtraTopics([]);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubject = e.target.value as SubjectType;
    setSubject(newSubject);
    setTopics([]);
    setExtraTopics([]);
  };

  const handleTopicToggle = (topic: string) => {
    setTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleAddCustomTopic = () => {
    if (customTopic.trim()) {
      const newTopic = customTopic.trim();
      setExtraTopics(prev => [...prev, newTopic]);
      setTopics(prev => [...prev, newTopic]);
      setCustomTopic('');
    }
  };

  // --- AI Scan Functions ---

  const startCamera = async () => {
    setShowCamera(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("無法開啟相機，請確認權限設定。");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = capturedImage.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data,
                },
              },
              {
                text: `你是一位資深的私人家教。請分析這張學生考卷照片。
                1. 辨識學生在哪些題目出錯了。
                2. 歸納學生的主要錯誤模式（例如：計算粗心、公式帶錯、讀題不清）。
                3. 指出觀念薄弱的地方。
                4. 給予後續輔導的具體建議。
                
                請使用繁體中文，格式清晰，並保持專業與簡潔。`,
              },
            ],
          },
        ],
      });

      const analysisResult = response.text;
      if (analysisResult) {
        const aiHeader = `\n\n--- 🤖 AI 考卷分析報告 ---\n`;
        setDetails(prev => prev + aiHeader + analysisResult);
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setError("AI 分析失敗，請稍後再試。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- End AI Scan Functions ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!studentName.trim()) {
      setError("請輸入學生姓名。");
      return;
    }
    if (topics.length === 0) {
      setError(`請至少選擇一個${category === '輔導' ? '教學重點' : '補課內容'}。`);
      return;
    }
    if (details.trim().length < 30) {
      setError(`內容詳述不得少於 30 字。目前字數：${details.trim().length}`);
      return;
    }

    if (initialData) {
      const updatedReport: Report = {
        ...initialData,
        date,
        category,
        studentName: studentName.trim(),
        subject: category === '輔導' ? subject : '英文',
        topics,
        details: details.trim(),
      };
      updateReport(updatedReport);
      setSuccess(true);
      onReportSubmitted();
      if (onCancelEdit) onCancelEdit();
    } else {
      const newReport: Report = {
        id: generateId(),
        tutorName,
        date,
        category,
        studentName: studentName.trim(),
        subject: category === '輔導' ? subject : '英文' as SubjectType,
        topics,
        details: details.trim(),
        timestamp: Date.now(),
      };
      saveReport(newReport);
      setSuccess(true);
      onReportSubmitted();
      
      setStudentName('');
      setTopics([]);
      setExtraTopics([]);
      setDetails('');
      setCapturedImage(null);
    }
  };

  const currentDefaultTopics = category === '補課' ? MAKEUP_TOPICS : SUBJECT_TOPICS[subject];

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all duration-500 relative ${
      initialData 
        ? 'border-indigo-500 ring-4 ring-indigo-100 shadow-2xl shadow-indigo-200/50 scale-[1.02]' 
        : 'border-gray-200'
    } overflow-hidden`}>
      {initialData && (
        <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 rounded-bl-lg text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1 z-20">
          <Edit3 className="w-3 h-3" />
          正在編輯
        </div>
      )}

      <div className={`p-6 border-b flex items-center justify-between ${
        initialData ? 'bg-indigo-50 border-indigo-100' : 'border-gray-100'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`${initialData ? 'bg-indigo-600' : 'bg-blue-600'} p-2.5 rounded-xl text-white shadow-lg`}>
            {initialData ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </div>
          <div>
            <h2 className={`text-xl font-bold ${initialData ? 'text-indigo-900' : 'text-gray-800'}`}>
              {initialData ? '編輯輔導紀錄' : '新增回報紀錄'}
            </h2>
          </div>
        </div>
        {initialData && onCancelEdit && (
          <button 
            type="button"
            onClick={onCancelEdit} 
            className="p-2 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all border border-gray-100 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">系統類別</label>
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
            <button
              type="button"
              onClick={() => handleCategoryChange('輔導')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                category === '輔導' 
                  ? 'bg-white text-blue-600 shadow-md border border-blue-100' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>輔導系統</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('補課')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                category === '補課' 
                  ? 'bg-white text-purple-600 shadow-md border border-purple-100' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>補課系統</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">學生姓名</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="輸入姓名"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
        </div>

        {category === '輔導' && (
          <div className="animate-fadeIn">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">輔導科目</label>
            <select
              value={subject}
              onChange={handleSubjectChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
            >
              {Object.keys(SUBJECT_TOPICS).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {/* AI Scan Section */}
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI 考卷智慧分析</span>
            </div>
            {!capturedImage && !showCamera && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  開啟相機
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  上傳照片
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {showCamera && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={takePhoto}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm shadow-xl"
                >
                  拍照
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-6 py-2 bg-gray-800 text-white rounded-full font-bold text-sm shadow-xl"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {capturedImage && !showCamera && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border-2 border-indigo-200">
                <img src={capturedImage} alt="Captured" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setCapturedImage(null)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all shadow-md ${
                  isAnalyzing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 正在閱卷分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    開始 AI 智慧分析
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700">
            {category === '輔導' ? `${subject} 教學重點` : '補課項目與進度'}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {currentDefaultTopics.map(topic => (
              <button
                type="button"
                key={topic}
                onClick={() => handleTopicToggle(topic)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm ${
                  topics.includes(topic)
                    ? category === '輔導' 
                      ? 'bg-blue-600 border-blue-600 text-white scale-105 shadow-blue-200'
                      : 'bg-purple-600 border-purple-600 text-white scale-105 shadow-purple-200'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {topic}
              </button>
            ))}
            {extraTopics.map(topic => (
              <button
                type="button"
                key={`extra-${topic}`}
                onClick={() => handleTopicToggle(topic)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm ${
                  topics.includes(topic)
                    ? 'bg-indigo-600 border-indigo-600 text-white scale-105 shadow-indigo-200'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
             <input 
               type="text"
               value={customTopic}
               onChange={(e) => setCustomTopic(e.target.value)}
               placeholder="輸入其他自訂項目..."
               className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white outline-none shadow-inner"
               onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTopic(); } }}
             />
             <button 
                type="button" 
                onClick={handleAddCustomTopic} 
                className="flex items-center space-x-1 px-5 py-2.5 text-sm bg-gray-800 hover:bg-black text-white rounded-xl transition-all font-bold shadow-md"
             >
               <Plus className="w-4 h-4" />
               <span>新增項目</span>
             </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            {category === '輔導' ? '詳細輔導狀況描述' : '補課內容詳述'} 
            <span className="text-gray-400 text-[10px] font-normal ml-2 tracking-widest">(最少 30 字)</span>
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={8}
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner leading-relaxed"
            placeholder="請描述教學重點、學生吸收程度... (可使用上方 AI 分析功能自動填寫)"
          />
          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-tighter">
            <span className={details.length < 30 ? 'text-orange-500' : 'text-emerald-500'}>
               {details.length < 30 ? `距離標準還差 ${30 - details.length} 字` : '字數要求已達成 ✅'}
            </span>
            <span className="text-gray-400">當前字數：{details.length}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 shadow-sm">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shadow-sm">
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p className="text-sm font-bold">{initialData ? '更新成功！已儲存變更' : '提交成功！感謝您的辛勞'}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {initialData && (
            <button 
              type="button" 
              onClick={onCancelEdit} 
              className="flex-1 bg-white border-2 border-gray-100 hover:border-red-200 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold py-4 rounded-2xl transition-all shadow-sm active:scale-95"
            >
              取消編輯
            </button>
          )}
          <button
            type="submit"
            className={`flex items-center justify-center space-x-2 font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95 text-lg ${
              initialData 
                ? 'flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' 
                : category === '補課'
                  ? 'w-full bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'
                  : 'w-full bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
            }`}
          >
            {initialData ? <Save className="w-6 h-6" /> : <Send className="w-6 h-6" />}
            <span>{initialData ? '儲存更新內容' : '提交回報資料'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
