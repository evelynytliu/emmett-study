# Emmett 學習基地 — CLAUDE.md

> **先讀這一頁就夠開工。** 細節看 `docs/CONTENT-INDEX.md`（自動產生的內容索引：哪些章節已有內容、考試排程與成績）、
> `AUTHORING.md`（出題手冊）、`docs/design-spec-2026-summer.md`（2026 暑假先修時期的完整設計規格，保留參考）、
> `docs/HISTORY3D-PLAN.md`（歷史 3D 場景規劃）。

## 這是什麼

- 為 **Emmett**（2026-09 起竹光國中七年級）做的**國中三年複習／預習網站**，之後可延用到高中。
  目標：對學習有興趣，會考考上**新竹高中**（預估 2029-05-19，見 `src/content/school.ts`）。
- 使用者：孩子（iPad／電腦）＋媽媽 Evelyn（偶爾看 `/parent`）。單純自用。
- 內容後台＝**Claude Code**：媽媽拍課本照片／講考試日期／講分數 → Claude 寫資料檔 → `npm run check` → commit → push → 自動上線。
- Repo：`https://github.com/evelynytliu/emmett-study`（2026-09 由 `guozhong-math-concepts` 改名，舊網址自動轉址）。
  線上站：Vercel `junior-high-lab.vercel.app`（push `main` 自動部署）。

## 站的結構（2026-09 學期版）

| 路由 | 用途 | 資料來源 |
|---|---|---|
| `/` | 學期儀表板：會考倒數、今天該回鍋的卡、連續學習天數、接下來要考（含考前節奏）、最近考過（成績＋錯題回鍋）、五科入口 | `school.ts`、`exams.ts`、`lib/streak.ts`、各 registry |
| `/subject/[id]` | 單科基地：這學期內容 ＋ 摺疊的「先修內容」＋ 章節地圖（目前學期排最前） | `lib/subject-content.ts` |
| `/prep/[id]` | **考前複習頁**（本站主力）：重點挖空＋翻卡＋比較表＋題組入口 | `content/prep/` |
| `/quiz/[id]` | 線上題組：答錯回鍋、必看詳解與概念；考後錯題回鍋也是題組 | `content/quizzes/` |
| `/goal` | 會考地圖：三年路線、會考說明、讀書法 | `school.ts` |
| `/archive` | 封存：2026 暑假先修（數學五段式單元、課表、螺旋複習、文言字、暑假作業） | 各 registry |
| `/hanzi`、`/history` | 常駐：形音義每日 10 字、歷史 3D 場景 | `content/hanzi/`、`content/history/` |
| `/parent` | 家長頁：學校考試（成績走勢、錯的概念）→ 複習頁翻卡掌握 → 題組 → 形音義／文言文 → 封存的先修單元 | 各 storage |

**加內容永遠是「寫一個 `.ts` 資料檔 → 註冊進 index.ts」，不改畫面程式。**

## 五個 skill（在 `.claude/skills/`，直接對 Claude 說就會用）

| 媽媽會說 | skill | 做什麼 |
|---|---|---|
| 「幫我做 XX 的複習頁」（附課本照片） | `add-prep` | 重點挖空＋翻卡＋比較表，掛章節與考試 |
| 「幫我出 XX 的題目」 | `add-quiz` | 8–12 題選擇／填空，附詳解與概念 |
| 「X 月 X 日要考 XX」 | `add-exam` | 加進 `exams.ts`，首頁倒數＋考前節奏 |
| 「XX 考了 N 分」「這是錯題」 | `after-exam` | 登記 `result`，錯題出成變形題組回鍋 |
| 「開學了」「換學期」「會考日期公布」 | `new-semester` | 切學期、補章節地圖、封存、改會考日 |

## 教學原則（每一頁都要守）

1. **答案預設遮住，先想再翻。** 翻卡、挖空、題組都是「提取」不是「閱讀」。
2. **錯的才是重點。** 卡片「再練」與答錯的題會依 1→3→7→14→30 天回鍋；連對 5 次算掌握。考錯的概念換題再考（`after-exam`）。
3. **每題／每卡都要有「為什麼」。** 題組必填 `explanation`＋`concept`；翻卡背面帶功能敘述。
4. **對齊課本版本**：國文／英文／自然＝翰林，數學／社會＝康軒（2026 入學）。章節掛 `subjects.ts` 的 `topicId`。
5. **題目不洩答案**：翻卡正面要改寫，別讓答案的字出現在題面（例「旋轉」→「轉動它」）。
6. **語氣**：對 13 歲孩子說話，不幼稚、不說教；錯了就說「概念還沒遷移」，不是「你笨」。
7. **考前節奏**（首頁自動顯示，`exams.ts` 的 `examPhase`）：>7 天先讀一遍 → 4–7 天只回鍋 → 1–3 天題組驗收 → 當天只翻「再練」。

## 設計風格（簡要、為複習而生）

- 淡底、一科一色（`subjects.ts` 的 `color`，inline style）、內容卡白底薄陰影、圓角 `rounded-2xl`。
- 首頁先給「現在該做什麼」（回鍋數、下一次考試、考前節奏），再給入口。**不放裝飾性動畫**（`float-bob` 只留在封存頁面）。
- 可點的東西看起來可點；遮住的答案用科目色實心塊，點開變淡底。
- 激勵只用兩個訊號：連續天數（`lib/streak.ts`，任何模組存紀錄時 `touchStreak()`）與「一次就對」題數。不做等級、金幣。
- 元件：Tailwind + `src/components/ui/`；翻卡 3D 樣式在 `globals.css` 的 `.flip`。

## 存進度

- 每個模組一個 `src/lib/*-storage.ts`：**localStorage 優先，Supabase 可選，失敗一律退回本機**。
- 翻卡狀態：`prep-storage.ts`（單列 jsonb `mathconcept_prep_pool`，開頁合併、標記後 upsert）。
- 連續天數：`streak.ts` 只存本機（`gz-streak`），純激勵，不上雲。
- **存過紀錄的 id、key 都不能改**（quiz id、prep id、card id、exam id、localStorage key）。

## 每次改完要跑

```bash
npm run check   # = validate（結構）＋ index（更新 docs/CONTENT-INDEX.md）＋ tsc
```

綠燈才 commit。commit 訊息用中文、說清楚加了哪個範圍（例 `自然 1-3 酵素複習頁＋9/24 小考`）。

## 學期切換／年度維護（詳見 skill `new-semester`）

- 開學：改 `school.ts` 的 `currentSemester`；`subjects.ts` 補新學期章節（`semester` 型別已涵蓋 7上～9下，不用改型別）。
- 會考日期公告：`school.ts` 的 `target.date`，`estimated: false`。
- 用完的階段性內容加進 `archive/page.tsx`，不刪；舊考試留在 `exams.ts`（成績走勢要用）。

## 部署

- **Vercel**（主要）：push `main` 自動部署到 `junior-high-lab.vercel.app`；含 Gemini 即時分析 route（`GEMINI_API_KEY` 在 Vercel）。
- GitHub Pages（備援靜態版）：`.github/workflows/deploy-pages.yml`，basePath 跟著 repo 名（workflow 注入 `REPO_NAME`），改 repo 名不用改程式。
- 本機完整版 `npm run dev`（或雙擊 `啟動教材.bat`）。

## 姊妹站：learning-tracker（獨立 repo，**不合併**）

- `D:\Evelyn\learning-tracker` → `https://learning-tracker-blush.vercel.app`（Next 15、Supabase Auth、PWA 推播）。
- **分工**：tracker 管「行為」（每日打卡、閱讀、螢幕時間、孩子自己登記錯題＋為什麼錯）；
  本站管「內容」（複習頁、題組、回鍋、考試排程、錯題換題再練）。
- **錯題流程**：孩子在 tracker 登記錯題與原因 → 媽媽拿那批錯題對 Claude 用 `after-exam` → 本站出變形題組回鍋。
- 首頁有 tracker 入口（`school.ts` 的 `siblingApps`）。兩站不共用程式碼、不共用登入；資料要互通時走 Supabase 查詢，不搬程式。

## 不要做的事

- 不要把先修的五段式數學單元改成「講解＋練習」；它們封存但設計不動。
- 不要每個單元都接 AI（額度）。AI 一律 try/catch 退回靜態。
- 不要在這個 repo 做「錯題本 App」——那是另一個獨立專案；這裡的回鍋只針對本站內容與考卷錯的概念。
- 不要抄考卷原題進錯題題組；要換情境的變形題。
