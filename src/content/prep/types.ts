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
    }
  | {
      // 點圖認部位：一張示意圖＋熱點。三種玩法：看標籤（讀）、認名稱（點熱點選名稱）、找位置（給名稱點熱點）。
      // 示意圖由 src/components/prep-figures.tsx 用 SVG 畫，figure 要在 PREP_FIGURES 裡。
      kind: "diagram";
      title: string;
      intro?: string;
      figure: PrepFigure;
      hotspots: PrepHotspot[];
    }
  | {
      // 排順序：流程／步驟類（科學方法七步、實驗步驟、消化順序…）。items 照正確順序寫，
      // 引擎會打亂讓孩子依序點選；點錯不給答案、算一次失誤。
      kind: "sequence";
      title: string;
      intro?: string;
      items: { id: string; label: string; detail?: string }[];
    }
  | {
      // 數線闖關：一關一個概念，關卡照順序解鎖。每題先自己作答（點數線／選答案），
      // 對錯都會看到「為什麼」；答錯的題在同一關最後回鍋，全對才過關。
      // 引擎在 src/components/mission-game.tsx。
      kind: "mission";
      title: string;
      intro?: string;
      line: { min: number; max: number }; // 數線範圍（整數）；所有題目的點都要落在裡面
      levels: MissionLevel[];
    };

export interface MissionLevel {
  id: string; // 區塊內唯一，存過紀錄後別改
  title: string;
  goal: string; // 一句話：這關在練什麼
  hint?: string; // 預設收起的提示（關鍵想法），卡住才點開
  challenges: MissionChallenge[]; // 照難度由淺到深寫，引擎不打亂
  // 熟練場：每次進關由 src/lib/mission-gen.ts 隨機出 count 題（challenges 留空陣列），過關會記時間。
  //   signs＝去括號只看符號（選改寫後的式子）；addsub＝兩數加減（打答案）；chain＝三數連算＋括號前有減號（打答案）
  generator?: { kind: MissionGenKind; count: number };
}

//   mulsign＝符號雷達（幾個數相乘，只判斷正／負／0）；muldiv＝乘除快算（打答案）；mixed＝四則混合（含平方，打答案）
//   expo＝指數快算（aⁿ／(-a)ⁿ／-aⁿ，打答案）
export const MISSION_GEN_KINDS = ["signs", "addsub", "chain", "mulsign", "muldiv", "mixed", "expo"] as const;
export type MissionGenKind = (typeof MISSION_GEN_KINDS)[number];

interface MissionChallengeBase {
  id: string; // 關卡內唯一
  prompt: string;
  why: string; // 作答後顯示的「為什麼」
  concept: string; // 概念標籤（過關畫面列出卡住的概念）
}

export type MissionChallenge =
  // 在數線上點出位置；targets 多個時要全部點出來
  | (MissionChallengeBase & { type: "place"; targets: number[] })
  // 選答案；layout "cards" 用大卡片（比大小用）
  | (MissionChallengeBase & { type: "choice"; choices: string[]; answerIndex: number; layout?: "cards" })
  // 用數字鍵盤打答案（整數）；expr 有寫就用大字顯示算式
  | (MissionChallengeBase & { type: "input"; expr?: string; answer: number })
  // 配對：左欄固定、右欄打亂，點左再點右；點錯算一次失誤（整題視為沒一次就對），全配完才算完成
  | (MissionChallengeBase & { type: "match"; pairs: { left: string; right: string }[] })
  // 排序：把 items 由小到大點回去（value 用來判斷順序，label 是顯示的式子）
  | (MissionChallengeBase & { type: "order"; items: { label: string; value: number }[] })
  // 找錯：一段別人的計算過程，點出哪一步錯了
  | (MissionChallengeBase & { type: "spot"; steps: string[]; wrongIndex: number })
  // 拼科學記號：打 a、用 −／＋ 調指數 n，畫面即時顯示 a×10ⁿ 展開是多少
  | (MissionChallengeBase & { type: "sci"; number: string; mantissa: number; exponent: number })
  // 數線散步：先預測終點（點數線），再看小點一步一步走。expr 是算式，moves 是每一步位移
  | (MissionChallengeBase & { type: "walk"; expr: string; start: number; moves: number[] });

// 可用的示意圖（新增圖時同步在 prep-figures.tsx 畫、在這裡登記）
export const PREP_FIGURES = ["microscope-compound", "microscope-dissecting"] as const;
export type PrepFigure = (typeof PREP_FIGURES)[number];

export interface PrepHotspot {
  id: string; // 組內唯一
  name: string; // 部位名稱（答案）
  x: number; // 圖上位置（viewBox 座標，與 prep-figures.tsx 的圖對齊）
  y: number;
  side?: "left" | "right"; // 標籤放哪一邊（預設右）
}

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
