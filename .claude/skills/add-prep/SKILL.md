---
name: add-prep
description: 從課本照片或範圍描述做一頁「考前複習頁」（重點挖空＋翻卡＋比較表＋題組入口），並掛到考試排程。當媽媽說「幫我做 XX 的複習頁／翻卡／小考要考 XX」時使用。
---

# add-prep：做一頁考前複習頁

## 輸入
- 課本照片（最常見）或一段範圍描述；科目；（可有）考試日期。
- 對照 `src/content/subjects.ts` 找 `topicId`；沒有合適的章節就先加一筆 topic。

## 步驟
1. **讀照片，抽出可考點**：名詞→定義、部位→功能、步驟順序、數值、比較（A vs B）。
   只放課本有的；自己補充的整理（例如比較表）要在 `intro` 註明「課本圖外的延伸整理」。
2. **選區塊組合**（`src/content/prep/types.ts`）：
   - `flashcards`：名詞／部位／人物／公式。正面＝功能或描述，背面＝名稱。**正面改寫，別洩答案。**
   - `keypoints`：一句一重點，用【】挖空要背的關鍵字，一句最多 2–3 個【】。
   - `compare`：兩個常被混淆的東西，列對比；儲存格也能【挖空】。
   - `quiz`：若已有或順手出了題組，掛 `quizId` 當驗收。
   - `sequence`：**排順序**（流程／步驟類：科學方法七步、實驗步驟、消化順序）。items 照正確順序寫，
     每步可帶 `detail` 一句說明；引擎提供「看順序／自己排」。範例：`science-method.ts`。
   - `diagram`：**點圖認部位**（部位／構造名稱最有效）。要一張示意圖（`figure`，在
     `src/components/prep-figures.tsx` 用 SVG 畫、`PREP_FIGURES` 登記，viewBox 200×260）＋熱點
     `{ id, name, x, y, side }`。三種玩法（看標籤／認名稱四選一／找位置）引擎自動提供。
     畫新圖時只求「相對位置跟課本圖一致、零件看得出來」，畫完在預覽裡確認標籤不重疊。
     範例：`science-microscope.ts` 的兩張顯微鏡。
3. **寫檔** `src/content/prep/<subject>-<topic>.ts`，`id` 用 `prep-<subject>-<topic>`，
   `source` 填課本頁碼。卡片 `id` 短且**整頁唯一**（`c1…`、`s1…`）。
4. **註冊** 進 `src/content/prep/index.ts` 的 `preps`。
5. 有考試日期 → 照 `add-exam` 在 `src/content/exams.ts` 加一筆，`links` 指到 `/prep/<id>`。
6. `npm run check` 綠燈 → commit（訊息寫科目與範圍）→ push。

## 品質檢查
- 每張卡翻開後，孩子能不能說出「為什麼」？背面 `note` 放數值／倍率等小字。
- 卡片 10–30 張一區；超過就拆兩個 `flashcards` 區塊（像複式／解剖顯微鏡）。
- 用詞照課本（例「載物臺」不是「載物台」、「旋轉盤」不是「物鏡轉換器」）。

## 範例
`src/content/prep/science-microscope.ts`（翰林自然 1-2 顯微鏡部位）。
