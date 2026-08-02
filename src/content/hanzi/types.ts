// src/content/hanzi/types.ts
// 國文「形音義」精熟模組——字音（看字寫注音）與字形（看注音寫國字）。
//
// 設計魂（跟英文單字 drill、線上題組同一套精神，但更嚴格）：
//   1. 答錯的題不只回鍋，還要「連續答對 2 次」才算過關（Epop 式循環，
//      確保不是矇對，而是真的會了）。
//   2. 注音題用站內注音鍵盤作答（iPad 直接點，不用切輸入法）；
//      國字題用手寫板寫字＋線上辨識（辨識連不上就退回「對照答案自評」，
//      跟 AI fallback 同一套「不能讓孩子卡住」原則）。
//   3. 每題一定有 explanation（為什麼、常見錯法）＋ concept（考點標籤）。
//
// 出新題：一天一個 .ts 檔 export 一個 HanziSet，到 index.ts 註冊即可
// （步驟見 AUTHORING.md「形音義」一節）。

export type HanziKind = "zhuyin" | "char";

export interface HanziQuestion {
  id: string; // 題組內唯一，例 "q1"。存過紀錄後別改。
  kind: HanziKind;
  // 題幹句子。考的目標用【】框起來：
  //   zhuyin 題：【葛】→ 顯示這個字，孩子用注音鍵盤拼出讀音
  //   char  題：【ㄉㄤˋ】→ 顯示這串注音，孩子手寫出正確的國字
  sentence: string;
  // 正解：zhuyin 題填注音字串（例 "ㄍㄜˇ"；一聲不加調號、輕聲用「˙」）
  //        char  題填一個國字（例 "蕩"）
  answer: string;
  explanation: string; // 詳解：詞義＋為什麼讀/寫成這樣＋常見錯法
  concept: string; // 考點標籤（例「破音字：橫」「同音易混：蕩／盪」）
}

export interface HanziSet {
  id: string; // 全站唯一，例 "hanzi-w1-d1"。存過紀錄後別改。
  title: string; // 例「第一週・星期一」
  subtitle: string; // 這一天的重點（給孩子看的一句話）
  kind: HanziKind; // 這一天的主題型（顯示徽章用；題目仍以各題 kind 為準）
  order: number;
  questions: HanziQuestion[];
}
