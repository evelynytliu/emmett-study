// src/lib/streak.ts
// 連續學習天數（純激勵用，只存 localStorage）。
// 任何模組「存下一次有做事的紀錄」時呼叫 touchStreak()：翻卡標記、題組完成、形音義一輪、歷史收卡。
// 規則：同一天多次只算一天；隔一天沒做就從 1 重來；best 記歷史最長。

import { todayIso } from "@/content/school";

export interface Streak {
  count: number; // 目前連續天數
  best: number; // 歷史最長
  last: string; // 最後一次有做事的日期 YYYY-MM-DD
  days: string[]; // 最近有做事的日期（最多 60 筆，首頁畫本週小點用）
}

// 存過紀錄後別改
const KEY = "gz-streak";

function hasWindow() {
  return typeof window !== "undefined";
}

export function getStreak(): Streak {
  if (!hasWindow()) return { count: 0, best: 0, last: "", days: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Streak) : null;
    if (!s) return { count: 0, best: 0, last: "", days: [] };
    // 超過一天沒做，顯示時就歸零（但 best 留著）
    const today = todayIso();
    if (s.last && s.last !== today && s.last !== yesterdayOf(today)) {
      return { ...s, count: 0 };
    }
    return s;
  } catch {
    return { count: 0, best: 0, last: "", days: [] };
  }
}

export function touchStreak(): Streak {
  const today = todayIso();
  const prev = getStreakRaw();
  if (prev.last === today) return prev;
  const count = prev.last === yesterdayOf(today) ? prev.count + 1 : 1;
  const next: Streak = {
    count,
    best: Math.max(prev.best, count),
    last: today,
    days: [...prev.days.filter((d) => d !== today), today].slice(-60),
  };
  if (hasWindow()) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* 存不進去也別讓孩子卡住 */
    }
  }
  return next;
}

function getStreakRaw(): Streak {
  if (!hasWindow()) return { count: 0, best: 0, last: "", days: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Streak) : { count: 0, best: 0, last: "", days: [] };
  } catch {
    return { count: 0, best: 0, last: "", days: [] };
  }
}

function yesterdayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return todayIso(new Date(y, m - 1, d - 1));
}

// 最近 7 天（含今天）每天有沒有做事，給首頁畫小點
export function lastSevenDays(s: Streak, today = todayIso()): { date: string; done: boolean }[] {
  const set = new Set(s.days);
  const [y, m, d] = today.split("-").map(Number);
  const out: { date: string; done: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = todayIso(new Date(y, m - 1, d - i));
    out.push({ date, done: set.has(date) });
  }
  return out;
}
