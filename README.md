# Emmett 學習基地（國中三年複習／預習網站）

> 2026-09 起改為**學期版**：首頁是學期儀表板（會考倒數、今天該回鍋的卡、連續學習天數、接下來要考＋考前節奏、最近考過的成績），
> 主力是**考前複習頁**（`/prep/<id>`：重點挖空＋翻卡＋比較表＋題組入口）與**線上題組**（`/quiz/<id>`，含考後錯題回鍋）。
> 2026 暑假的「升國中先修」內容全部封存在 `/archive`，仍可使用。
> 給 Claude Code 的專案記憶在 [`CLAUDE.md`](CLAUDE.md)，內容索引在 [`docs/CONTENT-INDEX.md`](docs/CONTENT-INDEX.md)（自動產生）。

## 平常怎麼用（媽媽）

在專案資料夾開 Claude Code，直接說話就好（對應 `.claude/skills/`）：

| 你會說 | Claude 做的事 |
|---|---|
| 「幫我做 1-3 酵素的複習頁，9/24 小考」（附課本照片） | `add-prep`＋`add-exam`：寫複習頁資料檔、排進考試 |
| 「幫我出一組 be 動詞的題目」 | `add-quiz`：8–12 題附詳解與概念 |
| 「9/10 自然小考考了 86 分，這幾題錯」（附考卷照片） | `after-exam`：登記成績、錯的概念出成變形題組回鍋 |
| 「開學了／換學期了／會考日期公布了」 | `new-semester`：切學期、補章節地圖、封存 |

每次 Claude 都會跑 `npm run check`（結構驗證＋更新索引＋型別），綠燈才 commit、push `main` → 自動上線。

## 網址

- **線上站（Vercel）**：`https://junior-high-lab.vercel.app`（push `main` 自動部署；含 Gemini 即時分析）。
  想讓網址跟 repo 同名，到 Vercel 專案 Settings → General 改專案名為 `emmett-study` 即可得到 `emmett-study.vercel.app`（舊網址可保留為別名）。
- **GitHub repo**：`https://github.com/evelynytliu/emmett-study`（2026-09 由 `guozhong-math-concepts` 改名；GitHub 會自動把舊網址轉過來）。
  部署的 basePath 由 workflow 注入 `REPO_NAME`，改 repo 名不用改程式。
- **GitHub Pages 靜態備援**：`https://evelynytliu.github.io/emmett-study/`（`.github/workflows/deploy-pages.yml`，沒有 AI route，自動退回靜態）。

## 本機執行

```bash
npm install
npm run dev
```

或雙擊 `啟動教材.bat`。打開 http://localhost:3000。

```bash
npm run check     # validate + index + tsc（每次改內容後）
npm run validate  # 只做結構驗證
npm run index     # 只重建 docs/CONTENT-INDEX.md
```

## 站的結構

| 路由 | 用途 |
|---|---|
| `/` | 學期儀表板 |
| `/subject/[id]` | 單科基地：這學期內容、先修內容（摺疊）、課本章節地圖 |
| `/prep/[id]` | 考前複習頁：翻卡「會了／再練」依 1→3→7→14→30 天回鍋 |
| `/quiz/[id]` | 線上題組：答錯回鍋、每題有詳解與概念 |
| `/goal` | 會考地圖：三年路線、會考說明、讀書法 |
| `/hanzi` | 形音義每日 10 字（注音鍵盤＋手寫辨識） |
| `/history` | 歷史 3D 場景館（康軒七上臺灣史） |
| `/archive` | 封存：暑假先修（數學五段式單元、課表、螺旋複習、文言字、暑假作業） |
| `/parent` | 家長檢視：學校考試成績走勢與錯的概念、翻卡掌握、題組弱概念、先修紀錄 |

## 資料與儲存

- 內容全部是 `src/content/**` 的 `.ts` 資料檔（版本控管、diff 可回復），不做網頁後台。
- 進度：每個模組一個 `src/lib/*-storage.ts`，**localStorage 優先、Supabase 可選、失敗退回本機**。
  Supabase 表都以 `mathconcept_` 前綴，schema 在 [`supabase/schema.sql`](supabase/schema.sql)。
- 環境變數見 [`.env.local.example`](.env.local.example)：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、
  `GEMINI_API_KEY`（即時分析）、`NEXT_PUBLIC_APP_PASSCODE`（公開站的密碼門，建議設）。

## 設計原則（一句話）

**先遮答案、自己想、再翻開對；錯的才是重點，會自動回鍋。** 完整理念與 2026 暑假先修時期的規格見
[`docs/design-spec-2026-summer.md`](docs/design-spec-2026-summer.md)。
