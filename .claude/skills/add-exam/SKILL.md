---
name: add-exam
description: 學校公布小考／段考／模擬考日期時，加進考試排程並掛上要用的複習頁或題組；首頁會自動倒數。當媽媽說「X 月 X 日要考 XX」時使用。
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
3. 段考通常跨多個範圍：一場考試可以掛多個連結。
4. `npm run check` → commit → push。考完的會自動沉到底部，不用刪。
