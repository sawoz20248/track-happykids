export type SubjectType = '英文' | '數學' | '國文' | '自然' | '社會';
export type CategoryType = '輔導' | '補課';

export interface Report {
  id: string;
  tutorName: string;
  date: string;
  category: CategoryType; // 新增類別欄位
  studentName: string;
  subject: SubjectType;
  topics: string[];
  details: string;
  timestamp: number;
}

export const SUBJECT_TOPICS: Record<SubjectType, string[]> = {
  '英文': ['單字', '課文閱讀', '文法解析', '聽力練習', '寫作指導'],
  '數學': ['觀念講解', '計算練習', '幾何圖形', '應用問題', '歷屆試題'],
  '國文': ['古文解析', '白話文閱讀', '作文指導', '修辭與成語', '國學常識'],
  '自然': ['生物', '理化計算', '實驗觀念', '地球科學', '觀念統整'],
  '社會': ['歷史脈絡', '地理環境', '公民素養', '時事分析', '重點整理'],
};

export const MAKEUP_TOPICS = ['課本', '習作', '閱讀', '小考', '測驗'];