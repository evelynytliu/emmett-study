// src/content/prep/index.ts
// 考前複習頁註冊表。新增一頁：在本資料夾寫 .ts、import 進來、放進陣列即可。
// 科目頁、首頁考試排程（exams.ts 掛 /prep/<id>）、家長頁都會自動吃到。

import type { PrepSet } from "./types";
import type { SubjectId } from "@/content/subjects";
import { prepScienceMicroscope } from "./science-microscope";
import { prepScienceMethod } from "./science-method";
import { prepMathIntegersMission } from "./math-integers-mission";
import { prepMathMulDivMission } from "./math-muldiv-mission";
import { prepChineseReadingTraps } from "./chinese-reading-traps";

export const preps: PrepSet[] = [prepScienceMethod, prepScienceMicroscope, prepMathIntegersMission, prepMathMulDivMission, prepChineseReadingTraps];

export function getPrep(id: string): PrepSet | undefined {
  return preps.find((p) => p.id === id);
}

export function getPrepsBySubject(subjectId: SubjectId): PrepSet[] {
  return preps
    .filter((p) => p.subjectId === subjectId)
    .sort((a, b) => a.order - b.order);
}

export type { PrepSet, PrepSection, PrepCard } from "./types";
