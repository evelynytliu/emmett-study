// src/content/hanzi/index.ts
// 形音義題組註冊表。新增一天：寫好 .ts、import 進來、放進陣列即可。
// /subject/chinese 科目頁、/hanzi/[id] 答題頁會自動吃到（詳見 AUTHORING.md）。

import type { HanziSet } from "./types";
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

export type { HanziSet, HanziQuestion, HanziKind } from "./types";
