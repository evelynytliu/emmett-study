// src/content/exams.ts
// 考試排程＋考試結果。首頁「接下來要考」與倒數都吃這裡；考完的會自動沉到「最近考過」（保留紀錄）。
//
// 用法：
//   1. 學校公布小考／段考日期 → 加一筆（skill: add-exam），links 掛要用的複習頁／題組。
//   2. 考完 → 在同一筆補 result（skill: after-exam）：分數、錯的概念，
//      並把錯題做成「變形題組」掛在 mistakesQuizId，讓錯的概念回鍋。
//   3. 家長頁會把 result 畫成各科成績走勢；首頁「最近考過」會顯示分數與錯題回鍋入口。

import type { SubjectId } from "./subjects";

export type ExamKind = "小考" | "段考" | "模擬考" | "會考" | "作業"; // 作業＝媽媽對答案的回家作業，也留紀錄看走勢

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
    id: "2026-09-07-sci-method-micro",
    date: "2026-09-07",
    subject: "science",
    kind: "小考",
    name: "1-2 科學方法流程＋顯微鏡部位",
    scope: "翰林自然 1-2，課本 p.23–25（科學方法）、p.30–31（顯微鏡）",
    links: [
      { href: "/prep/prep-science-method", title: "科學方法：排步驟・變因翻卡" },
      { href: "/quiz/quiz-science-method-1", title: "科學方法理解題（12 題）" },
      { href: "/prep/prep-science-microscope", title: "顯微鏡部位：認圖・翻卡" },
      { href: "/quiz/quiz-science-microscope-1", title: "顯微鏡理解題（13 題）" },
    ],
  },
  {
    id: "2026-09-11-chi-hw-14",
    date: "2026-09-11",
    subject: "chinese",
    kind: "作業",
    name: "自學選文一：古代神話與寓言選（第 14 回）",
    scope: "翰林國文 7 上自學選文一：夸父逐日、精衛填海、濫竽充數等神話與寓言",
    links: [
      { href: "/prep/prep-chinese-reading-traps", title: "讀長文三步・成語翻卡・神話 vs 寓言" },
      { href: "/quiz/quiz-chinese-reading-mistakes-1", title: "寓言主旨・陷阱字・成語 回鍋題組（12 題）" },
    ],
    result: {
      score: 50,
      total: 100,
      weak: [
        "寓言抓主旨：看故事結局與人物的話，不被表面關鍵字帶走",
        "判斷文章語氣：先分清作者是稱讚還是批評",
        "文言寓言：先找「誰做了什麼、結果如何」，再推道理",
        "題幹陷阱字：「何者錯誤／不同」要逐個選項判斷",
        "成語：事半功倍、揠苗助長、謙沖自牧",
        "神話與寓言的定義差異",
      ],
      note: "短題 10/15，一則寓言問道理 5/10，題組 1/5。文章越長掉越多；錯的選項幾乎都含有文章裡的字，是用關鍵字猜，不是沒耐心。",
      mistakesQuizId: "quiz-chinese-reading-mistakes-1",
    },
  },
  {
    id: "2026-09-18-chi-hw-1",
    date: "2026-09-18",
    subject: "chinese",
    kind: "作業",
    name: "第一課 夏夜（第 1 回）",
    scope: "翰林國文 7 上第一課 夏夜（楊喚）：字音字形、詩意解讀、新詩特徵",
    links: [
      { href: "/prep/prep-chinese-reading-traps", title: "讀長文三步・成語翻卡・神話 vs 寓言" },
      { href: "/quiz/quiz-chinese-reading-mistakes-1", title: "寓言主旨・陷阱字・成語 回鍋題組（12 題）" },
    ],
    result: {
      score: 50,
      total: 100,
      weak: [
        "字音字義辨析（撒、提／驅／爛／諧）",
        "判斷新詩語氣：從動詞、形容詞看情緒",
        "選項陷阱字：「皆／都／唯一」要回文章核對範圍",
        "詞彙：月亮的別稱與金烏（太陽）",
        "新詩的特徵（格律自由）",
      ],
      note: "配合題 5/5、楊喚詩題組 4/5：短的、具體的畫面讀得懂。錯在字音字義、詩的語氣，和「何者錯誤」「皆」這類要逐字看的選項。",
      mistakesQuizId: "quiz-chinese-reading-mistakes-1",
    },
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
