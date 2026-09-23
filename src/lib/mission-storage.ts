// src/lib/mission-storage.ts
// 數線闖關的關卡紀錄：每一關「最佳一次就對／玩幾次／最近卡住的概念／全對最快秒數」。
// 跟 prep-storage 同一套：localStorage 優先、Supabase 單列 jsonb 可選、
// 開頁前合併（同 uid 取較新）、每次過關後 upsert；上雲失敗不影響本機。
// 家長頁與 AI 分析都從這裡讀，所以孩子在 iPad 玩、媽媽在電腦看也看得到。

import { getSupabase, isSupabaseEnabled } from "./supabase";

export interface MissionRecord {
  best: number; // 最佳「一次就對」題數
  total: number;
  plays: number;
  missed: string[]; // 最近一次卡住的概念
  bestSec?: number; // 全部一次就對時的最快秒數（熟練場用）
  lastFirstTry?: number; // 最近一次的「一次就對」題數
  t?: string; // 最後更新（ISO time，合併時比新舊）
}
export type MissionRecords = Record<string, MissionRecord>; // levelId → 紀錄（單一區塊內）
export type MissionPoolState = Record<string, MissionRecord>; // uid = prepId:sectionIndex:levelId

// 存過紀錄後別改這兩把 key
const POOL_KEY = "gz-mission:pool";
const TABLE_POOL = "mathconcept_mission_pool";
// 舊版（2026-09-19 以前）每個區塊各存一把：gz-prep:mission:<prepId>:<si>。第一次開頁時搬進 pool。
const LEGACY_PREFIX = "gz-prep:mission:";

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

export function missionUid(prepId: string, sectionIndex: number, levelId: string) {
  return `${prepId}:${sectionIndex}:${levelId}`;
}

// 把舊版分散的 key 併進 pool（只做一次：併完把舊 key 刪掉）
function migrateLegacy(pool: MissionPoolState): MissionPoolState {
  if (!hasWindow()) return pool;
  const next = { ...pool };
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(LEGACY_PREFIX)) keys.push(k);
    }
    for (const k of keys) {
      const recs = lsRead<MissionRecords>(k, {});
      const prefix = k.slice(LEGACY_PREFIX.length); // prepId:si
      for (const [levelId, r] of Object.entries(recs)) {
        const uid = `${prefix}:${levelId}`;
        if (!next[uid]) next[uid] = { ...r, t: r.t ?? "2026-09-19T00:00:00.000Z" };
      }
      window.localStorage.removeItem(k);
    }
    if (keys.length > 0) lsWrite(POOL_KEY, next);
  } catch {
    /* ignore */
  }
  return next;
}

export function getMissionPoolLocal(): MissionPoolState {
  return migrateLegacy(lsRead<MissionPoolState>(POOL_KEY, {}));
}

export async function syncMissionPool(): Promise<MissionPoolState> {
  const local = getMissionPoolLocal();
  if (!isSupabaseEnabled) return local;
  const sb = getSupabase();
  if (!sb) return local;
  try {
    const { data, error } = await sb.from(TABLE_POOL).select("state").eq("pool_key", "main").maybeSingle();
    if (error || !data?.state) return local;
    const cloud = data.state as MissionPoolState;
    const merged: MissionPoolState = { ...cloud };
    for (const [uid, e] of Object.entries(local)) {
      const c = merged[uid];
      if (!c || (e.t ?? "") > (c.t ?? "")) merged[uid] = e;
    }
    lsWrite(POOL_KEY, merged);
    return merged;
  } catch {
    return local;
  }
}

export async function saveMissionPool(state: MissionPoolState): Promise<void> {
  lsWrite(POOL_KEY, state);
  if (!isSupabaseEnabled) return;
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb
      .from(TABLE_POOL)
      .upsert({ pool_key: "main", state, updated_at: new Date().toISOString() }, { onConflict: "pool_key" });
  } catch {
    /* 上雲失敗沒關係，本機已存 */
  }
}

// 取出某個區塊（prepId + sectionIndex）的紀錄，key 換成 levelId 給引擎用
export function recordsForSection(pool: MissionPoolState, prepId: string, sectionIndex: number): MissionRecords {
  const prefix = `${prepId}:${sectionIndex}:`;
  const out: MissionRecords = {};
  for (const [uid, r] of Object.entries(pool)) if (uid.startsWith(prefix)) out[uid.slice(prefix.length)] = r;
  return out;
}
