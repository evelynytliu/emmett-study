---
name: add-quiz
description: 出一組線上題組（選擇＋填空，附詳解與概念標籤）並註冊。當媽媽說「幫我出 XX 的題目／題組」時使用。
---

# add-quiz：出一組題組

完整格式與範本在 `AUTHORING.md` §1、§`QuizSet` 範本。重點：

1. 檔案 `src/content/quizzes/<subject>-<topic>-<n>.ts`，`id` 用 `quiz-<subject>-<topic>-<n>`，
   掛 `subjectId` 與 `topicId`（對照 `src/content/subjects.ts`）。
2. 每題必填 `explanation`（為什麼，不是重述答案）與 `concept`（考什麼）。
   干擾選項要對準「用背的會犯的錯」。
3. 8–12 題；先出 1–2 題像課本，再出換情境的變形題。
4. 註冊進 `src/content/quizzes/index.ts`。
5. 若這組是某個複習頁的驗收，在該 `prep` 的 `sections` 加 `{ kind: "quiz", quizId }`。
6. `npm run check` 綠燈 → commit → push。
