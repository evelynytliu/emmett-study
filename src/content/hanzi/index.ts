// src/content/hanzi/index.ts
// 形音義題庫註冊表。所有檔案的題目會「合併成一個大題庫」（/hanzi 一次一輪抽 10 字），
// 檔案只是內容整理單位。新增題目：寫好 .ts、import 進來、放進陣列即可（詳見 AUTHORING.md）。

import type { HanziQuestion, HanziSet } from "./types";
import { hanziW1D1 } from "./week1-day1";
import { hanziW1D2 } from "./week1-day2";
import { hanziW1D3 } from "./week1-day3";
import { hanziW1D4 } from "./week1-day4";
import { hanziW1D5 } from "./week1-day5";
import { hanziW1D6 } from "./week1-day6";
import { hanziW2D1 } from "./week2-day1";
import { hanziW2D2 } from "./week2-day2";
import { hanziW2D3 } from "./week2-day3";
import { hanziW2D4 } from "./week2-day4";
import { hanziW2D5 } from "./week2-day5";
import { hanziW2D6 } from "./week2-day6";

export const hanziSets: HanziSet[] = [
  hanziW1D1,
  hanziW1D2,
  hanziW1D3,
  hanziW1D4,
  hanziW1D5,
  hanziW1D6,
  hanziW2D1,
  hanziW2D2,
  hanziW2D3,
  hanziW2D4,
  hanziW2D5,
  hanziW2D6,
].sort((a, b) => a.order - b.order);

export function getHanziSet(id: string): HanziSet | undefined {
  return hanziSets.find((s) => s.id === id);
}

// 合併後的大題庫。uid 全站唯一（setId:題目id）——精熟紀錄掛在 uid 上，別改。
export interface HanziPoolQuestion extends HanziQuestion {
  uid: string;
}

export const allHanziQuestions: HanziPoolQuestion[] = hanziSets.flatMap((s) =>
  s.questions.map((q) => ({ ...q, uid: `${s.id}:${q.id}` })),
);

export type { HanziSet, HanziQuestion, HanziKind } from "./types";
