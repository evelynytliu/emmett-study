// src/content/prep/types.ts
// 「考前複習頁」型別——學校小考／段考前，把課本一個範圍整理成一頁：
// 重點挖空（先遮答案）＋翻卡（看功能想名稱）＋比較表＋連到題組驗收。
//
// 設計原則（延續全站的起點：破解背誦）：
//   1. 答案預設遮住。孩子先在心裡答，再點開對。不是讀，是提取。
//   2. 每張卡可以標「會了／再練」，錯的會依間隔（1→3→7→14→30 天）回鍋。
//   3. 一頁對應課本一個範圍，掛 topicId，並可掛到 exams.ts 的考試。
//
// 挖空語法：字串裡用【答案】把要遮的部分框起來，例「目鏡放大倍率通常是【10× 或 15×】」。
// 一句話可以有多個【】。

import type { SubjectId } from "@/content/subjects";

export interface PrepCard {
  id: string; // 組內唯一，存過紀錄後別改
  front: string; // 正面（預設顯示）：功能／描述／題目
  back: string; // 背面（預設遮住）：名稱／答案
  note?: string; // 背面小字補充，例「4× / 10× / 60×」
}

export type PrepSection =
  | {
      kind: "keypoints";
      title: string;
      intro?: string;
      items: string[]; // 每條一個重點，可含【挖空】
    }
  | {
      kind: "flashcards";
      title: string;
      intro?: string;
      frontLabel: string; // 例「功能」
      backLabel: string; // 例「名稱」
      cards: PrepCard[];
    }
  | {
      kind: "compare";
      title: string;
      intro?: string;
      columns: [string, string]; // 兩個比較對象
      rows: { label: string; a: string; b: string }[]; // 儲存格可含【挖空】
    }
  | {
      kind: "quiz";
      quizId: string; // 對應 quizzes/ 的題組 id
      title?: string;
    };

export interface PrepSet {
  id: string; // 全站唯一，例 "prep-science-microscope"。存過紀錄後別改。
  subjectId: SubjectId;
  topicId?: string; // 對應 subjects.ts 章節地圖
  title: string;
  description: string; // 一兩句：範圍、怎麼用
  source?: string; // 課本出處，例「翰林自然 1-2 p.30–31」
  order: number;
  sections: PrepSection[];
}
