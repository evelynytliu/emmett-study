// src/content/quizzes/index.ts
// 線上題組註冊表。新增一組題目：在本資料夾寫好 .ts、import 進來、放進陣列即可。
// /subject/[id] 科目頁、/quiz/[id] 答題頁、家長頁都會自動吃到（詳見 AUTHORING.md）。

import type { QuizSet } from "./types";
import type { SubjectId } from "@/content/subjects";
import { quizMathIntegers1 } from "./math-integers-1";
import { quizChineseWenyan1 } from "./chinese-wenyan-1";
import { quizEnglishBe1 } from "./english-be-1";
import { quizScienceCell1 } from "./science-cell-1";
import { quizSocialGeo1 } from "./social-geo-1";
import { quizScienceMicroscope1 } from "./science-microscope-1";
import { quizScienceMethod1 } from "./science-method-1";

export const quizzes: QuizSet[] = [
  quizMathIntegers1,
  quizChineseWenyan1,
  quizEnglishBe1,
  quizScienceMethod1,
  quizScienceMicroscope1,
  quizScienceCell1,
  quizSocialGeo1,
];

export function getQuiz(id: string): QuizSet | undefined {
  return quizzes.find((q) => q.id === id);
}

export function getQuizzesBySubject(subjectId: SubjectId): QuizSet[] {
  return quizzes
    .filter((q) => q.subjectId === subjectId)
    .sort((a, b) => a.order - b.order);
}

export type { QuizSet, QuizQuestion } from "./types";
