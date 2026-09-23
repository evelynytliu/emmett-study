// src/lib/mission-review.ts
// 家長頁「AI 分析闖關」的共用型別 + 前端呼叫 helper + 本地啟發式 fallback。
// 型別同時被家長頁元件與 /api/mission-review 後端使用。
//
// 與 diagnose.ts / coach.ts 一致：任何錯誤都不丟出，回傳 fallbackToStatic=true，
// 前端改用 heuristicMissionReview（純規則），家長一定看得到一份分析。

import { aiEndpoint } from "./ai-endpoint";

// 送給 AI 的每一關摘要（從 mission-storage 的紀錄整理出來）
export interface MissionLevelSignal {
  prepTitle: string;
  levelTitle: string;
  goal: string;
  drill: boolean; // 熟練場（隨機出題）
  best: number; // 最佳一次就對
  lastFirstTry: number | null; // 最近一次
  total: number;
  plays: number;
  missed: string[]; // 最近一次卡住的概念
  bestSec: number | null;
}

export interface MissionReviewRequest {
  levels: MissionLevelSignal[];
  lockedLevels: string[]; // 還沒解鎖／沒玩過的關卡名稱（給 AI 判斷進度）
}

export interface MissionReview {
  summary: string; // 兩三句：整體狀況（給媽媽看）
  stable: string[]; // 已經站穩的概念
  weak: { concept: string; evidence: string; action: string }[]; // 還沒遷移的概念＋證據＋怎麼做
  next_step: string; // 下一步：該玩哪一關、怎麼陪
  parent_tip: string; // 一句給媽媽的提醒（怎麼問、別怎麼說）
}

export interface MissionReviewResponse {
  ok: boolean;
  review: MissionReview | null;
  fallbackToStatic: boolean;
  error?: string;
}

export async function requestMissionReview(req: MissionReviewRequest): Promise<MissionReviewResponse> {
  try {
    const res = await fetch(aiEndpoint("/api/mission-review"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) return { ok: false, review: null, fallbackToStatic: true, error: `HTTP ${res.status}` };
    return (await res.json()) as MissionReviewResponse;
  } catch (err) {
    return { ok: false, review: null, fallbackToStatic: true, error: err instanceof Error ? err.message : "unknown error" };
  }
}

// AI 不可用時的離線分析：純規則，從紀錄本身講出可以講的話。
export function heuristicMissionReview(req: MissionReviewRequest): MissionReview {
  const played = req.levels.filter((l) => l.plays > 0);
  const perfect = played.filter((l) => l.best === l.total);
  const shaky = played.filter((l) => l.best < l.total);
  const missCount = new Map<string, { n: number; where: string[] }>();
  for (const l of played)
    for (const c of l.missed) {
      const e = missCount.get(c) ?? { n: 0, where: [] };
      e.n += 1;
      if (!e.where.includes(l.levelTitle)) e.where.push(l.levelTitle);
      missCount.set(c, e);
    }
  const weak = [...missCount.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 4)
    .map(([concept, e]) => ({
      concept,
      evidence: `在「${e.where.join("、")}」最近一次還是答錯。`,
      action: "請他把這一關再玩一次，答對後用自己的話講一遍「為什麼」；講不出來就點開那一關的關鍵想法。",
    }));
  const stable = [...new Set(perfect.map((l) => l.goal))].slice(0, 5);
  const next = shaky[0] ?? (req.lockedLevels.length > 0 ? null : null);
  return {
    summary:
      played.length === 0
        ? "還沒有闖關紀錄。先讓孩子從第 1 關開始玩，每天 2–3 關。"
        : `玩過 ${played.length} 關，其中 ${perfect.length} 關全部一次就對。${shaky.length > 0 ? `有 ${shaky.length} 關還沒全對，卡住的概念列在下面。` : "目前玩過的關卡都站穩了。"}`,
    stable,
    weak,
    next_step: next
      ? `先回去把「${next.levelTitle}」玩到全對（目前最佳 ${next.best}/${next.total}）。`
      : req.lockedLevels.length > 0
        ? `接著解鎖「${req.lockedLevels[0]}」。`
        : "全部關卡都過了，可以每隔幾天回來玩熟練場，看秒數有沒有進步。",
    parent_tip: "過關後問他「為什麼」，而不是「對不對」。他講得出道理（例如「負負得正是因為反方向兩次」）才算真的會。",
  };
}
