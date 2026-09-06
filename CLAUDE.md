# Emmett 學習基地 — CLAUDE.md

> **先讀這一頁就夠開工。** 細節看 `docs/CONTENT-INDEX.md`（自動產生的內容索引）、
> `AUTHORING.md`（出題手冊）、`docs/design-spec-2026-summer.md`（2026 暑假先修時期的完整設計規格，保留參考）。

## 這是什麼

- 為 **Emmett**（2026-09 起竹光國中七年級）做的**國中三年複習／預習網站**。
  目標：對學習有興趣，會考考上**新竹高中**（預估 2029-05-19，見 `src/content/school.ts`）。
- 使用者：孩子（iPad／電腦）＋媽媽 Evelyn（偶爾看 `/parent`）。單純自用。
- 內容後台＝**Claude Code**：媽媽拍課本照片 → 請 Claude 做頁面 → `npm run check` → commit → push → 自動上線。

## 站的結構（2026-09 學期版）

| 路由 | 用途 | 資料來源 |
|---|---|---|
| `/` | 學期儀表板：會考倒數、今天該回鍋的卡、接下來要考、五科入口 | `school.ts`、`exams.ts`、各 registry |
| `/subject/[id]` | 單科基地：這學期內容 ＋ 摺疊的「先修內容」＋ 章節地圖 | `lib/subject-content.ts` |
| `/prep/[id]` | **考前複習頁**（本站主力）：重點挖空＋翻卡＋比較表＋題組入口 | `content/prep/` |
| `/quiz/[id]` | 線上題組：答錯回鍋、必看詳解與概念 | `content/quizzes/` |
| `/goal` | 會考地圖：三年路線、會考說明、讀書法 | `school.ts` |
| `/archive` | 封存：2026 暑假先修（數學五段式單元、課表、螺旋複習、文言字、暑假作業） | 各 registry |
| `/hanzi`、`/history` | 常駐：形音義每日 10 字、歷史 3D 場景 | `content/hanzi/`、`content/history/` |
| `/parent` | 家長頁 | 各 storage |

**加內容永遠是「寫一個 `.ts` 資料檔 → 註冊進 index.ts」，不改畫面程式。**

## 三個 skill（在 `.claude/skills/`，直接對 Claude 說就會用）

- `add-prep`：從課本照片做一頁**考前複習頁**（最常用）。
- `add-quiz`：出一組線上題組。
- `add-exam`：學校公布考試日期時，加進排程並掛上要用的頁面。

## 教學原則（每一頁都要守）

1. **答案預設遮住，先想再翻。** 翻卡、挖空、題組都是「提取」不是「閱讀」。
2. **錯的才是重點。** 卡片「再練」與答錯的題會依 1→3→7→14→30 天回鍋；連對 5 次算掌握。
3. **每題／每卡都要有「為什麼」。** 題組必填 `explanation`＋`concept`；翻卡背面帶功能敘述。
4. **對齊課本版本**：國文／英文／自然＝翰林，數學／社會＝康軒（2026 入學）。章節掛 `subjects.ts` 的 `topicId`。
5. **題目不洩答案**：翻卡正面要改寫，別讓答案的字出現在題面（例「旋轉」→「轉動它」）。
6. **語氣**：對 13 歲孩子說話，不幼稚、不說教；錯了就說「概念還沒遷移」，不是「你笨」。

## 設計風格（簡要、為複習而生）

- 淡底、一科一色（`subjects.ts` 的 `color`，inline style）、內容卡白底薄陰影。
- 首頁先給「現在該做什麼」（回鍋數、下一次考試），再給入口。不放裝飾性動畫。
- 可點的東西看起來可點；遮住的答案用科目色實心塊，點開變淡底。
- 元件：Tailwind + `src/components/ui/`；翻卡 3D 樣式在 `globals.css` 的 `.flip`。

## 存進度

- 每個模組一個 `src/lib/*-storage.ts`：**localStorage 優先，Supabase 可選，失敗一律退回本機**。
- 翻卡狀態：`prep-storage.ts`（單列 jsonb `mathconcept_prep_pool`，開頁合併、標記後 upsert）。
- **存過紀錄的 id、key 都不能改**（quiz id、prep id、card id、localStorage key）。

## 每次改完要跑

```bash
npm run check   # = validate（結構）＋ index（更新 docs/CONTENT-INDEX.md）＋ tsc
```

綠燈才 commit。commit 訊息用中文、說清楚加了哪個範圍。

## 學期切換／年度維護

- 開學：改 `school.ts` 的 `currentSemester`；`subjects.ts` 補新學期章節（`semester` 加 `"8上"` 等時，同步改 `SubjectTopic` 型別與 `subject-view.tsx` 的 `semesters`）。
- 會考日期公告：`school.ts` 的 `target.date`，`estimated: false`。
- 暑假先修內容已封存在 `/archive`；再有「用完的階段性內容」也照樣加進 `archive/page.tsx`，不刪。

## 部署

- push `main` → GitHub Actions 建靜態站到 GitHub Pages；basePath 跟著 repo 名稱（workflow 注入 `REPO_NAME`），**改 repo 名不用改程式**。
- 本機完整版 `npm run dev`（AI 判讀要 `claude login`）；靜態版沒有 AI route，會自動退回。

## 不要做的事

- 不要把先修的五段式數學單元改成「講解＋練習」；它們封存但設計不動。
- 不要每個單元都接 AI（額度）。AI 一律 try/catch 退回靜態。
- 不要在這個 repo 做「錯題本 App」——那是另一個獨立專案；這裡的回鍋只針對本站內容。
