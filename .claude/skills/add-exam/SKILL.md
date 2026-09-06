---
name: add-exam
description: 學校公布小考／段考／模擬考日期時，加進考試排程並掛上要用的複習頁或題組；首頁會自動倒數並顯示考前節奏。當媽媽說「X 月 X 日要考 XX」時使用。考完登記成績用 after-exam。
---

# add-exam：加一場考試

1. 在 `src/content/exams.ts` 的 `exams` 加一筆：
   ```ts
   {
     id: "YYYY-MM-DD-<subject>-<slug>",
     date: "YYYY-MM-DD",
     subject: "science",        // chinese | math | english | science | social | 全科
     kind: "小考",              // 小考 | 段考 | 模擬考 | 會考
     name: "1-2 顯微鏡部位名稱",
     scope: "翰林自然 1-2，課本 p.30–31",
     links: [{ href: "/prep/prep-science-microscope", title: "顯微鏡部位翻卡" }],
   }
   ```
2. `links` 只能指向存在的 `/prep/<id>` 或 `/quiz/<id>`（`npm run validate` 會檢查）。
   還沒有頁面就先用 `add-prep` 做一頁。
3. 段考通常跨多個範圍：一場考試可以掛多個連結（每個範圍一頁複習頁＋一組驗收題組最理想）。
4. 首頁會依剩幾天顯示考前節奏（>7 天先讀一遍 → 4–7 天只回鍋 → 1–3 天題組驗收 → 當天只翻「再練」），
   不用另外做讀書計畫。
5. `npm run check` → commit → push。考完的會自動沉到「最近考過」，不用刪；成績用 `after-exam` 登記。
