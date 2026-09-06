// src/lib/prep-storage.ts
// 考前複習頁的翻卡紀錄：每張卡「會了／再練」＋間隔複習到期日。
// 跟 hanzi-storage 的題庫池同一套：localStorage 優先、Supabase 單列 jsonb 可選、
// 開頁前合併（同 uid 取較新）、每次標記後 upsert；上雲失敗不影響本機。

import { getSupabase, isSupabaseEnabled } from "./supabase";
import { todayIso } from "@/content/school";

// 間隔複習：連續答對 n 次 → 幾天後再看；連續 5 次視為掌握
export const PREP_INTERVALS = [1, 3, 7, 14, 30];

export interface PrepCardEntry {
  s: "got" | "again" | "mastered"; // 狀態
  n: number; // 連續答對次數
  d: string; // 下次到期日 YYYY-MM-DD
  t: string; // 最後更新（ISO time，合併時比新舊）
}
export type PrepPoolState = Record<string, PrepCardEntry>; // uid = prepId:cardId

// 存過紀錄後別改這兩把 key
const POOL_KEY = "gz-prep:pool";
const TABLE_POOL = "mathconcept_prep_pool";

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

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return todayIso(dt);
}

export function cardUid(prepId: string, cardId: string) {
  return `${prepId}:${cardId}`;
}

export function getPrepPoolLocal(): PrepPoolState {
  return lsRead<PrepPoolState>(POOL_KEY, {});
}

export async function syncPrepPool(): Promise<PrepPoolState> {
  const local = getPrepPoolLocal();
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
    const cloud = data.state as PrepPoolState;
    const merged: PrepPoolState = { ...cloud };
    for (const [uid, e] of Object.entries(local)) {
      const c = merged[uid];
      if (!c || e.t > c.t) merged[uid] = e;
    }
    lsWrite(POOL_KEY, merged);
    return merged;
  } catch {
    return local;
  }
}

export async function savePrepPool(state: PrepPoolState): Promise<void> {
  lsWrite(POOL_KEY, state);
  if (!isSupabaseEnabled) return;
  const sb = getSupabase();
  if (!sb) return;
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

// 標記一張卡；回傳更新後的整個 pool（呼叫端負責 save）
export function markCard(
  pool: PrepPoolState,
  uid: string,
  result: "got" | "again",
): PrepPoolState {
  const today = todayIso();
  const prev = pool[uid];
  let entry: PrepCardEntry;
  if (result === "got") {
    const n = (prev?.n ?? 0) + 1;
    entry = {
      s: n >= PREP_INTERVALS.length ? "mastered" : "got",
      n,
      d: addDays(today, PREP_INTERVALS[Math.min(n, PREP_INTERVALS.length) - 1]),
      t: new Date().toISOString(),
    };
  } else {
    entry = { s: "again", n: 0, d: today, t: new Date().toISOString() };
  }
  return { ...pool, [uid]: entry };
}

export function clearPrep(pool: PrepPoolState, prepId: string): PrepPoolState {
  const next: PrepPoolState = {};
  for (const [uid, e] of Object.entries(pool)) {
    if (!uid.startsWith(prepId + ":")) next[uid] = e;
  }
  return next;
}

// 首頁用：今天到期（該回鍋）的卡片數
export function dueCount(pool: PrepPoolState, today = todayIso()): number {
  return Object.values(pool).filter((e) => e.s !== "mastered" && e.d <= today)
    .length;
}
