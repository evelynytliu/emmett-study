// src/lib/hanzi-storage.ts
// 形音義精熟循環的答題紀錄儲存層。
// 跟 quiz-storage 同一套策略：localStorage 優先（離線可用），
// 有 Supabase 就 append 一筆存檔上雲；上雲失敗不影響本機。

import { getSupabase, isSupabaseEnabled } from "./supabase";
import { touchStreak } from "./streak";

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

// 注意：孩子已經開始累積精熟紀錄，這兩把 key 絕對不能再改（改了進度就歸零）
const RECORDS_KEY = "gz-hanzi:records";
const POOL_KEY = "gz-hanzi:pool";
const TABLE_ATTEMPTS = "mathconcept_hanzi_attempts";
const TABLE_POOL = "mathconcept_hanzi_pool";

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

// ── 題庫精熟狀態（跨場次，uid → 狀態）─────────────────
// m = 是否精熟（上一次遇到是一次就對）、w = 累計答錯次數、s = 最後練到的時間
export interface HanziPoolEntry {
  m: boolean;
  w: number;
  s: string;
}
export type HanziPoolState = Record<string, HanziPoolEntry>;

export function getHanziPoolLocal(): HanziPoolState {
  return lsRead<HanziPoolState>(POOL_KEY, {});
}

function writeHanziPoolLocal(state: HanziPoolState) {
  lsWrite(POOL_KEY, state);
}

// 開始練之前呼叫：拉雲端狀態合併（同一 uid 取較新的 s），失敗就用本機。
export async function syncHanziPool(): Promise<HanziPoolState> {
  const local = getHanziPoolLocal();
  if (!isSupabaseEnabled) return local;
  const sb = getSupabase();
  if (!sb) return local;
  try {
    const { data, error } = await sb
      .from(TABLE_POOL)
      .select("state")
      .eq("pool_key", "main")
      .maybeSingle();
    if (error || !data?.state) return local;
    const cloud = data.state as HanziPoolState;
    const merged: HanziPoolState = { ...cloud };
    for (const [uid, e] of Object.entries(local)) {
      const c = merged[uid];
      if (!c || e.s > c.s) merged[uid] = e;
    }
    writeHanziPoolLocal(merged);
    return merged;
  } catch {
    return local;
  }
}

// 每輪結束呼叫：存本機＋上雲（上雲失敗不影響本機）。
export async function saveHanziPool(state: HanziPoolState): Promise<void> {
  writeHanziPoolLocal(state);
  touchStreak();
  if (isSupabaseEnabled) {
    const sb = getSupabase();
    if (sb) {
      try {
        await sb
          .from(TABLE_POOL)
          .upsert(
            { pool_key: "main", state, updated_at: new Date().toISOString() },
            { onConflict: "pool_key" },
          );
      } catch {
        /* 上雲失敗沒關係，本機已存 */
      }
    }
  }
}

export function getAllHanziRecords(): Record<string, HanziRecord> {
  return lsRead<Record<string, HanziRecord>>(RECORDS_KEY, {});
}

export function getHanziRecord(setId: string): HanziRecord | null {
  return getAllHanziRecords()[setId] ?? null;
}

// 家長頁用：拉雲端全部輪次歷史（沒開 Supabase 就用本機彙總折衷呈現）
export interface HanziAttemptRow {
  setId: string;
  firstTryCorrect: number;
  total: number;
  wrongQuestionIds: string[];
  selfJudged: number;
  createdAt: string;
}

export async function getHanziHistory(): Promise<HanziAttemptRow[]> {
  if (isSupabaseEnabled) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from(TABLE_ATTEMPTS)
          .select(
            "set_id, first_try_correct, total, wrong_question_ids, self_judged, created_at",
          )
          .order("created_at", { ascending: false });
        if (!error && data) {
          return (
            data as {
              set_id: string;
              first_try_correct: number;
              total: number;
              wrong_question_ids: string[] | null;
              self_judged: number | null;
              created_at: string;
            }[]
          ).map((r) => ({
            setId: r.set_id,
            firstTryCorrect: r.first_try_correct,
            total: r.total,
            wrongQuestionIds: r.wrong_question_ids ?? [],
            selfJudged: r.self_judged ?? 0,
            createdAt: r.created_at,
          }));
        }
      } catch {
        /* 讀不到就退回本機 */
      }
    }
  }
  return Object.values(getAllHanziRecords()).map((r) => ({
    setId: r.setId,
    firstTryCorrect: r.lastFirstTry,
    total: r.total,
    wrongQuestionIds: r.wrongQuestionIds,
    selfJudged: 0,
    createdAt: r.lastFinishedAt,
  }));
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
