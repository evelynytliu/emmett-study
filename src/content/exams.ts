// src/content/exams.ts
// 考試排程。首頁「接下來要考」與倒數都吃這裡；考完的會自動沉到底部（保留紀錄）。
// 每次學校公布小考／段考日期，就在這裡加一筆，並把要用的複習頁／題組掛上去。

import type { SubjectId } from "./subjects";

export type ExamKind = "小考" | "段考" | "模擬考" | "會考";

export interface Exam {
  id: string; // 例 "2026-09-10-sci-micro"
  date: string; // YYYY-MM-DD
  subject: SubjectId | "全科";
  kind: ExamKind;
  name: string; // 例「1-2 顯微鏡部位」
  scope?: string; // 範圍（課本頁數／章節）
  // 這次考試要用的內容：路由 + 顯示文字。prep 頁用 /prep/<id>，題組用 /quiz/<id>。
  links: { href: string; title: string }[];
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
