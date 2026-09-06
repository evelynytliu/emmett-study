# 內容後台指南（用 Claude Code 出題、加教材）

> 這份是「內容後台」的操作手冊。你的後台**不是網頁管理介面，而是 Claude Code 桌機版**——
> 你在專案資料夾裡跟 Claude 說「幫我出一組數學題」，它就照下面的格式寫進 `.ts` 檔，
> 跑一次驗證、commit、push，Vercel 自動上線。**題目品質＝Claude 出的，不是 Gemini。**
>
> 為什麼用這種後台最正確（給你的說明在最下面「為什麼這樣設計」）。

---

## 你平常會做的事

> 2026-09 學期版最常用的是 **考前複習頁**（`add-prep`）、**考試排程**（`add-exam`）、**考後錯題回鍋**（`after-exam`），
> 步驟都在 `.claude/skills/*/SKILL.md`，直接對 Claude 說話就會用。下面是各種內容型態的格式細節。

### 1. 加一組線上題目（最常用）

跟 Claude 說類似這樣的話就好：

> 「幫我出一組**英文**題目，翰林七上 **現在進行式** 的範圍，8 題選擇加填空，
> 每題要有詳解和它在考什麼概念，干擾選項要對準『用背的會犯的錯』。」

Claude 會：
1. 在 `src/content/quizzes/` 新增一個檔案，例如 `english-present-continuous-1.ts`
2. 照 `QuizSet` 格式寫好（見下方範本）
3. 到 `src/content/quizzes/index.ts` 把它註冊進 `quizzes` 陣列
4. 跑 `npm run validate` 確認沒有結構錯誤
5. （你同意的話）commit + push

**題目就會自動出現在**該科的 `/subject/[id]` 頁，孩子點進去就能做，家長頁也自動追蹤。

### 2. 加一個數學概念單元（五段式）

數學單元是這個網站的靈魂——**不是講解＋練習**，而是 CLAUDE.md 規定的五段式
（情境→引導推導→用自己的話說→變形題→回扣）。跟 Claude 說：

> 「幫我做一個數學五段式單元：**一元一次不等式**，靜態模式，
> 最容易被背的點是『為什麼乘除負數要變號』。」

Claude 會照 `src/content/types.ts` 的 `Unit` 格式，在 `src/content/` 新增 `unit-09.ts`，
註冊進 `src/content/index.ts`，必要時也加進課表 `src/content/curriculum.ts`。

### 3. 加文言字 / 暑假作業

- 文言字（古今異義）：`src/content/wenyan/`，格式見 `wenyan/types.ts`（五拍流程）
- 暑假作業：`src/content/homework/`，格式見 `homework/types.ts`（草稿 or 單字）

### 4. 加一天「形音義」精熟題（注音／手寫國字）

國文的形音義模組在 `src/content/hanzi/`（掛在章節地圖 `chinese-pre-2 字音字形`）。
**所有檔案的題目會自動合併成一個大題庫**（路由 `/hanzi`）：每輪抽 10 個字，
未精熟／答錯過的優先出，精熟狀態跨場次累積（本機＋雲端）。
**輪內精熟循環**：答錯的字會在幾題後回鍋、要**連對 2 次**才過關；
「一次就對」才算精熟。兩種題型：

- `kind: "zhuyin"`（看字寫注音）：題幹用【】框住要考的**國字**，
  `answer` 填注音字串，例 `"ㄍㄜˇ"`（一聲不加調號、輕聲用 `˙`）。
  孩子用站內注音鍵盤作答。
- `kind: "char"`（看注音寫國字）：題幹用【】框住**注音**，例 `【ㄉㄤˋ】`，
  `answer` 填一個國字，例 `"蕩"`。孩子在手寫板寫字，送 Google 手寫辨識批改；
  辨識連不上會自動退回「對照答案自評」。

出題規則：
1. 一題只考**一個字**——一個詞要考兩個字就拆成 `q1a`、`q1b` 兩題（句子相同、標記不同字）。
2. 例句自己寫（不要整句照抄參考書），但**考的字、正確讀音/寫法、常見錯法**要對準考點；
   `explanation` 要講「為什麼＋常見錯在哪」，`concept` 給考點標籤（例「破音字：橫（ㄏㄥˋ）」）。
3. 一批題目一個檔（例 `week3-day1.ts`），export 一個 `HanziSet`，
   到 `src/content/hanzi/index.ts` 註冊——**新題會自動進大題庫**，不會多出新卡片。
   `id` 例 `hanzi-w3-d1`；精熟紀錄掛在 `setId:題目id` 上，**存過紀錄就都別改**。
4. `npm run validate` 會檢查：標記恰好一個、注音答案只含注音符號、
   國字答案是單一國字、注音題框的是字／國字題框的是注音。

---

## 三個提醒（每次出題都適用）

1. **不要只考記憶。** 這個網站的起點是「孩子習慣背、題目一變就錯」。
   所以每題都要有 `concept`（在考什麼）和 `explanation`（為什麼），
   選擇題的干擾選項要故意做成「背規則會選的錯答案」。
2. **對齊課本版本。** 國文/英文/自然＝翰林，數學/社會＝康軒（2026 國一）。
   章節名稱、範圍要照這些版本，掛 `topicId` 時對照 `src/content/subjects.ts` 的章節地圖。
3. **出完一定跑 `npm run validate`。** 它會抓：id 撞號、選項索引超範圍、
   答案不在選項裡、掛到不存在的科目/章節。綠燈才 push。

---

## `QuizSet` 範本（線上題目）

```ts
// src/content/quizzes/<科目>-<主題>-<序號>.ts
import type { QuizSet } from "./types";

export const quizXxx: QuizSet = {
  id: "quiz-english-present-continuous-1", // 全站唯一，存過紀錄後別改
  subjectId: "english",                    // chinese | math | english | science | social
  topicId: "english-7a-4",                 // 對照 subjects.ts 的章節地圖（可省略）
  title: "現在進行式・be + V-ing",
  description: "一兩句：這組在練什麼、什麼時候做。",
  order: 2,                                // 同科目內排序
  questions: [
    {
      id: "q1",
      type: "choice",                      // choice | text
      question: "題幹，可用 \\n 換行",
      choices: ["A 選項", "B 選項", "C 選項", "D 選項"],
      answerIndex: 1,                      // 正解索引（0 起算）
      explanation: "為什麼是 B——不是只重述答案，要說出道理、點破背規則的陷阱。",
      concept: "這題在考的概念（家長頁會用它彙整弱點）",
    },
    {
      id: "q2",
      type: "text",
      question: "填空題題幹",
      answerText: ["is", "'s"],            // 可接受的答案（忽略大小寫/空白/全半形）
      explanation: "…",
      concept: "…",
    },
  ],
};
```

註冊（`src/content/quizzes/index.ts`）：

```ts
import { quizXxx } from "./english-present-continuous-1";
export const quizzes: QuizSet[] = [ /* …既有… */ quizXxx ];
```

---

## 加新科目 / 新章節

科目和章節地圖都在 `src/content/subjects.ts`。要開新章節就往對應科目的 `topics`
加一筆 `{ id, semester, title }`；`id` 一旦被題目掛過就別改。首頁科目卡、科目頁、
家長頁都吃這份資料，不用改任何畫面程式。

---

## 為什麼這樣設計（給你的完整說明）

你問「後台可不可以是 Claude Code 桌機版」——**可以，而且這是目前最正確的做法**，原因：

- **題目品質。** 你信任 Claude 出的題勝過 Gemini。內容用 Claude Code（桌機版，
  吃你的訂閱、不佔 API 費用）在本機產生、寫進程式碼、commit；
  網站跑在 Vercel，孩子答題時走的是純靜態內容 + Gemini 只負責「分析孩子的解釋」
  這種便宜的即時判讀。**出題（貴、要品質）用 Claude；即時陪練（量大、要便宜）用 Gemini**，
  各司其職。
- **不用另外做管理後台。** 內容是結構化 `.ts` 檔（version control 管理），
  改錯了看得到 diff、可以回復，比做一個網頁 CMS 更穩、成本更低。
- **驗證擋在上線前。** `npm run validate` 是你的守門員，
  避免手滑把壞掉的題目推上線讓孩子卡住。

### 這個後台的標準流程
```
1. 在專案資料夾開 Claude Code 桌機版
2. 「幫我出一組 XX 題目 / 做一個 XX 單元」
3. Claude 寫檔 + 註冊 + npm run validate（綠燈）
4. git commit + git push → Vercel 自動部署
5. 孩子在 iPad/電腦上就看到新內容
```

### 未來若想要「網頁後台」（進階，非必要）
如果哪天你想在手機上、不開電腦也能加題目，可以再做一個「Supabase 存題庫 +
簡單表單頁」的版本；但那會讓題目來源變成手打或 Gemini，**失去「Claude 出題」的品質優勢**。
建議維持現在這套，需要出題時開 Claude Code 就好。
