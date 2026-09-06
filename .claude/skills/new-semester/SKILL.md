---
name: new-semester
description: 開學／換學期時的維護清單：切換目前學期、補新學期章節地圖、封存用完的內容、更新會考日期。當媽媽說「開學了」「換學期了」「會考日期公布了」時使用。
---

# new-semester：換學期

三年六個學期都走同一套，不要動畫面程式。

## 步驟
1. **切學期**：`src/content/school.ts` 的 `currentSemester` 改成新學期（`"7下"`、`"8上"`…）。
   `roadmap` 若這學期的 `focus / science / advice` 要調整，順手改；首頁與 `/goal` 自動更新。
2. **補章節地圖**：`src/content/subjects.ts` 每科的 `topics` 加新學期章節，`semester` 填新學期
   （型別已涵蓋 7上～9下，不用改型別）。`id` 命名照既有規則：`math-7b-1`、`science-8a-2`…；
   **被題目掛過的 id 不能改**。章節名稱照課本目錄（國文／英文／自然＝翰林，數學／社會＝康軒）。
3. **封存**：上學期的複習頁與題組**不刪**，繼續留在科目頁（章節地圖會依學期分組，
   目前學期排最前）。若有整批「用完的階段性內容」（像暑假先修），加進 `src/app/archive/page.tsx` 的 `groups`。
4. **會考日期**：教育部公告後改 `school.target.date`，`estimated: false`。
5. **考試排程**：`src/content/exams.ts` 舊的考試不刪（家長頁成績走勢要用）；學校公布新學期行事曆就用 `add-exam` 加。
6. `npm run check` → commit（訊息：`開學：切換到 7下，補各科章節地圖`）→ push。

## 升八年級／九年級額外要做
- 自然科從生物換成理化（八年級）、加地科（九年級）：`subjects.ts` 的 `science.tagline` 與章節照課本改。
- 九年級開始有模擬考：`add-exam` 用 `kind: "模擬考"`，成績用 `result.grade`（A++…C）。
