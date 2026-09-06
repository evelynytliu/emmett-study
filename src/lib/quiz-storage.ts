// src/lib/quiz-storage.ts
// 線上題組的答題紀錄儲存層。
//
// 跟其他儲存層同一套策略：預設 localStorage（離線可用、零設定），
// .env 有 Supabase 就同步上雲；Supabase 失敗一律退回 localStorage，孩子不卡住。
//
// 兩層資料：
//   - 「每題組最新狀態」（QuizRecord）：resume、首頁/科目頁顯示進度
//   - 「每次完成的存檔」（append-only 上 mathconcept_quiz_attempts）：家長頁看歷史與弱概念

import { getSupabase, isSupabaseEnabled } from "./supabase";
import { touchStreak } from "./streak";

export interface QuizAttempt {
  quizId: string;
  // 第一次作答就對的題數（衡量真實實力；回鍋後全對是精熟門檻，不算進這裡）
  firstTryCorrect: number;
  total: number;
  wrongQuestionIds: string[]; // 曾答錯過的題目 id（弱點分析用）
  finishedAt: string;
}

// 每個題組的彙總紀錄（最新 + 統計）
export interface QuizRecord {
  quizId: string;
  attempts: number; // 完成過幾輪
  bestFirstTry: number; // 歷史最佳「一次就對」題數
  lastFirstTry: number;
  total: number;
  lastFinishedAt: string;
  wrongQuestionIds: string[]; // 最近一輪答錯過的題
}

const RECORDS_KEY = "gz-quiz:records";
const TABLE_ATTEMPTS = "mathconcept_quiz_attempts";

function hasWindow() {
  return typeof window !== "undefined";
}

function lsRead<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsWrite(key: string, value: unknown) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 存不進去也別讓孩子卡住 */
  }
}

export function getAllQuizRecords(): Record<string, QuizRecord> {
  return lsRead<Record<string, QuizRecord>>(RECORDS_KEY, {});
}

export function getQuizRecord(quizId: string): QuizRecord | null {
  return getAllQuizRecords()[quizId] ?? null;
}

// 完成一輪題組時呼叫：更新本機彙總，並 append 一筆存檔到 Supabase（可失敗）
export async function saveQuizAttempt(a: QuizAttempt): Promise<void> {
  const all = getAllQuizRecords();
  const prev = all[a.quizId];
  all[a.quizId] = {
    quizId: a.quizId,
    attempts: (prev?.attempts ?? 0) + 1,
    bestFirstTry: Math.max(prev?.bestFirstTry ?? 0, a.firstTryCorrect),
    lastFirstTry: a.firstTryCorrect,
    total: a.total,
    lastFinishedAt: a.finishedAt,
    wrongQuestionIds: a.wrongQuestionIds,
  };
  lsWrite(RECORDS_KEY, all);
  touchStreak();

  if (isSupabaseEnabled) {
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from(TABLE_ATTEMPTS).insert({
          quiz_id: a.quizId,
          first_try_correct: a.firstTryCorrect,
          total: a.total,
          wrong_question_ids: a.wrongQuestionIds,
          created_at: a.finishedAt,
        });
      } catch {
        /* 上雲失敗沒關係，本機已存 */
      }
    }
  }
}

// 家長頁用：拉雲端全部歷史（沒開 Supabase 就用本機彙總折衷呈現）
export interface QuizAttemptRow {
  quizId: string;
  firstTryCorrect: number;
  total: number;
  wrongQuestionIds: string[];
  createdAt: string;
}

export async function getQuizHistory(): Promise<QuizAttemptRow[]> {
  if (isSupabaseEnabled) {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from(TABLE_ATTEMPTS)
        .select("quiz_id, first_try_correct, total, wrong_question_ids, created_at")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return (
          data as {
            quiz_id: string;
            first_try_correct: number;
            total: number;
            wrong_question_ids: string[] | null;
            created_at: string;
          }[]
        ).map((r) => ({
          quizId: r.quiz_id,
          firstTryCorrect: r.first_try_correct,
          total: r.total,
          wrongQuestionIds: r.wrong_question_ids ?? [],
          createdAt: r.created_at,
        }));
      }
    }
  }
  // 本機 fallback：每題組只有最新一筆
  return Object.values(getAllQuizRecords()).map((r) => ({
    quizId: r.quizId,
    firstTryCorrect: r.lastFirstTry,
    total: r.total,
    wrongQuestionIds: r.wrongQuestionIds,
    createdAt: r.lastFinishedAt,
  }));
}
