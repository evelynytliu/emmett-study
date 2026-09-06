// src/content/exams.ts
// 考試排程＋考試結果。首頁「接下來要考」與倒數都吃這裡；考完的會自動沉到「最近考過」（保留紀錄）。
//
// 用法：
//   1. 學校公布小考／段考日期 → 加一筆（skill: add-exam），links 掛要用的複習頁／題組。
//   2. 考完 → 在同一筆補 result（skill: after-exam）：分數、錯的概念，
//      並把錯題做成「變形題組」掛在 mistakesQuizId，讓錯的概念回鍋。
//   3. 家長頁會把 result 畫成各科成績走勢；首頁「最近考過」會顯示分數與錯題回鍋入口。

import type { SubjectId } from "./subjects";

export type ExamKind = "小考" | "段考" | "模擬考" | "會考";

export interface ExamResult {
  score?: number; // 得分（小考／段考）
  total?: number; // 滿分，預設 100
  grade?: string; // 等第或評語，例「A」「B++」（模擬考／會考用）
  weak?: string[]; // 錯的概念（一句一個），家長頁彙整弱點用
  mistakesQuizId?: string; // 考後錯題變形題組（/quiz/<id>），考錯的概念換題再練
  note?: string; // 一句話：這次的觀察，例「粗心 3 題、真的不會 2 題」
}

export interface Exam {
  id: string; // 例 "2026-09-10-sci-micro"
  date: string; // YYYY-MM-DD
  subject: SubjectId | "全科";
  kind: ExamKind;
  name: string; // 例「1-2 顯微鏡部位」
  scope?: string; // 範圍（課本頁數／章節）
  // 這次考試要用的內容：路由 + 顯示文字。prep 頁用 /prep/<id>，題組用 /quiz/<id>。
  links: { href: string; title: string }[];
  result?: ExamResult; // 考完再填
}

export const exams: Exam[] = [
  {
    id: "2026-09-10-sci-micro",
    date: "2026-09-10",
    subject: "science",
    kind: "小考",
    name: "1-2 顯微鏡部位名稱",
    scope: "翰林自然 1-2，課本 p.30–31",
    links: [{ href: "/prep/prep-science-microscope", title: "顯微鏡部位翻卡" }],
  },
];

export function upcomingExams(today: string): Exam[] {
  return exams
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function pastExams(today: string): Exam[] {
  return exams
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// 考前節奏：依剩幾天告訴孩子「現在該做哪一步」。
// 原則跟全站一樣：先完整提取一遍 → 只回鍋沒會的 → 題組驗收 → 考前只翻「再練」的卡。
export interface ExamPhase {
  label: string; // 短標籤（首頁 chip）
  hint: string; // 一句話：現在做什麼
}

export function examPhase(daysLeft: number): ExamPhase {
  if (daysLeft > 7)
    return { label: "先讀一遍", hint: "把複習頁完整過一遍，每張卡都標「會了」或「再練」。" };
  if (daysLeft >= 4)
    return { label: "回鍋期", hint: "每天只練「再練」的卡，5 分鐘就好；別從頭全部再看。" };
  if (daysLeft >= 1)
    return { label: "驗收期", hint: "做題組驗收；錯的看詳解，回複習頁只翻錯的那幾張。" };
  if (daysLeft === 0)
    return { label: "今天考", hint: "早上翻一次「再練」的卡就好，不要再讀新東西。" };
  return { label: "考完了", hint: "把錯的題目留下來，請媽媽做成錯題回鍋。" };
}

export function resultRate(r: ExamResult | undefined): number | null {
  if (!r || r.score === undefined) return null;
  const total = r.total ?? 100;
  return total > 0 ? r.score / total : null;
}
