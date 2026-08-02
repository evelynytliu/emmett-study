// src/lib/hanzi-storage.ts
// 形音義精熟循環的答題紀錄儲存層。
// 跟 quiz-storage 同一套策略：localStorage 優先（離線可用），
// 有 Supabase 就 append 一筆存檔上雲；上雲失敗不影響本機。

import { getSupabase, isSupabaseEnabled } from "./supabase";

export interface HanziAttempt {
  setId: string;
  firstTryCorrect: number; // 第一次見到就答對的題數（實力分）
  total: number;
  wrongQuestionIds: string[]; // 曾答錯過的題（弱點分析用）
  selfJudged: number; // 手寫辨識連不上、改用自評過關的題數（供家長參考）
  finishedAt: string;
}

export interface HanziRecord {
  setId: string;
  attempts: number;
  bestFirstTry: number;
  lastFirstTry: number;
  total: number;
  lastFinishedAt: string;
  wrongQuestionIds: string[];
}

const RECORDS_KEY = "gz-hanzi:records";
const TABLE_ATTEMPTS = "mathconcept_hanzi_attempts";

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

export function getAllHanziRecords(): Record<string, HanziRecord> {
  return lsRead<Record<string, HanziRecord>>(RECORDS_KEY, {});
}

export function getHanziRecord(setId: string): HanziRecord | null {
  return getAllHanziRecords()[setId] ?? null;
}

export async function saveHanziAttempt(a: HanziAttempt): Promise<void> {
  const all = getAllHanziRecords();
  const prev = all[a.setId];
  all[a.setId] = {
    setId: a.setId,
    attempts: (prev?.attempts ?? 0) + 1,
    bestFirstTry: Math.max(prev?.bestFirstTry ?? 0, a.firstTryCorrect),
    lastFirstTry: a.firstTryCorrect,
    total: a.total,
    lastFinishedAt: a.finishedAt,
    wrongQuestionIds: a.wrongQuestionIds,
  };
  lsWrite(RECORDS_KEY, all);

  if (isSupabaseEnabled) {
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from(TABLE_ATTEMPTS).insert({
          set_id: a.setId,
          first_try_correct: a.firstTryCorrect,
          total: a.total,
          wrong_question_ids: a.wrongQuestionIds,
          self_judged: a.selfJudged,
          created_at: a.finishedAt,
        });
      } catch {
        /* 上雲失敗沒關係，本機已存 */
      }
    }
  }
}
