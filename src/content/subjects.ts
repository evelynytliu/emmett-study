// src/content/subjects.ts
// 五大科目註冊表——整個學習站的一級架構。
//
// 每一科是一個「領域」：有自己的主題色、出版社版本、章節地圖（topics）。
// 首頁的科目卡、/subject/[id] 科目頁、題組（quizzes）、家長儀表板
// 都靠這張表把內容歸類。新內容（單元、題組、字卡）一律掛在某個 subjectId 底下。
//
// 教材版本（2026 入學）：國文翰林、數學康軒、英文翰林、自然翰林、社會康軒。
// topics 是依課本目錄整理的章節骨架，用來在科目頁顯示「涵蓋地圖」
// （哪些章已有內容、哪些還沒），也讓之後出題時有穩定的 topicId 可掛。

import type { Semester } from "./school";

export type SubjectId = "chinese" | "math" | "english" | "science" | "social";

export interface SubjectTopic {
  id: string; // 穩定 key，例 "math-7a-1"。題組用 topicId 掛上來，別改。
  semester: Semester | "先修"; // 7上…9下（school.ts 的 Semester）；先修 = 不綁課本章節的基礎能力
  title: string; // 章節或主題名稱
}

export interface Subject {
  id: SubjectId;
  name: string; // 國文
  emoji: string;
  publisher: string; // 翰林 / 康軒
  tagline: string; // 科目卡上的一句話（對孩子說的）
  // 主題色（inline style 用，避免 Tailwind 動態 class 被 purge）
  color: {
    main: string; // 飽和主色
    soft: string; // 淡底（卡片、徽章底）
    grad: string; // 漸層（科目卡頭、按鈕）
  };
  topics: SubjectTopic[];
}

export const subjects: Subject[] = [
  {
    id: "chinese",
    name: "國文",
    emoji: "📜",
    publisher: "翰林",
    tagline: "文言文不用背，自己推得出來",
    color: {
      main: "hsl(350 72% 52%)",
      soft: "hsl(350 72% 52% / 0.1)",
      grad: "linear-gradient(135deg, hsl(350 72% 52%), hsl(20 85% 58%))",
    },
    topics: [
      { id: "chinese-pre-1", semester: "先修", title: "文言文・古今異義" },
      { id: "chinese-pre-2", semester: "先修", title: "字音字形" },
      { id: "chinese-pre-3", semester: "先修", title: "成語與詞語運用" },
      { id: "chinese-7a-1", semester: "7上", title: "新詩（夏夜）與白話選文" },
      {
        id: "chinese-7a-2",
        semester: "7上",
        title: "文言選文（論語選・兒時記趣・朋友相交）",
      },
      { id: "chinese-7a-3", semester: "7上", title: "閱讀理解與寫作" },
      {
        id: "chinese-7a-4",
        semester: "7上",
        title: "語文常識（標點符號・資訊檢索）",
      },
    ],
  },
  {
    id: "math",
    name: "數學",
    emoji: "🧮",
    publisher: "康軒",
    tagline: "不背公式，把概念自己推出來",
    color: {
      main: "hsl(252 83% 62%)",
      soft: "hsl(252 83% 62% / 0.1)",
      grad: "linear-gradient(135deg, hsl(252 83% 62%), hsl(280 82% 64%))",
    },
    // 康軒七上 1-3 章、七下 4-9 章（依 108 課綱康軒目次）
    topics: [
      {
        id: "math-7a-1",
        semester: "7上",
        title: "第1章 整數的運算（負數・數線・指數記法與科學記號）",
      },
      {
        id: "math-7a-2",
        semester: "7上",
        title: "第2章 分數的運算（因數倍數・分數四則・指數律）",
      },
      { id: "math-7a-3", semester: "7上", title: "第3章 一元一次方程式" },
      { id: "math-7b-1", semester: "7下", title: "第4章 二元一次聯立方程式" },
      { id: "math-7b-2", semester: "7下", title: "第5章 直角坐標平面" },
      { id: "math-7b-3", semester: "7下", title: "第6章 比與比例式" },
      { id: "math-7b-4", semester: "7下", title: "第7章 一元一次不等式" },
      { id: "math-7b-5", semester: "7下", title: "第8章 線對稱與三視圖" },
      { id: "math-7b-6", semester: "7下", title: "第9章 統計圖表與資料分析" },
    ],
  },
  {
    id: "english",
    name: "英文",
    emoji: "🔤",
    publisher: "翰林",
    tagline: "單字拼到全對，文法用得出來",
    color: {
      main: "hsl(24 92% 52%)",
      soft: "hsl(24 92% 52% / 0.12)",
      grad: "linear-gradient(135deg, hsl(24 92% 52%), hsl(45 95% 50%))",
    },
    // 翰林七上文法主軸（單元標題以課本目次為準，文法順序可靠）
    topics: [
      { id: "english-pre-1", semester: "先修", title: "基礎單字（拼到全對）" },
      { id: "english-7a-1", semester: "7上", title: "be 動詞（am / is / are）" },
      {
        id: "english-7a-2",
        semester: "7上",
        title: "指示代名詞 this / that・Yes-No 問句",
      },
      {
        id: "english-7a-3",
        semester: "7上",
        title: "these / those・名詞複數",
      },
      { id: "english-7a-4", semester: "7上", title: "現在進行式（be + V-ing）" },
      {
        id: "english-7a-5",
        semester: "7上",
        title: "一般動詞現在式・Wh- 問句",
      },
      { id: "english-7a-6", semester: "7上", title: "There is / There are" },
    ],
  },
  {
    id: "science",
    name: "自然",
    emoji: "🔬",
    publisher: "翰林",
    tagline: "七年級是生物——用眼睛和邏輯看生命",
    color: {
      main: "hsl(158 62% 40%)",
      soft: "hsl(158 62% 40% / 0.1)",
      grad: "linear-gradient(135deg, hsl(158 62% 40%), hsl(190 70% 45%))",
    },
    // 七年級自然＝生物（108 課綱主題；翰林課本章名另有故事化標題，以主題歸類）
    topics: [
      {
        id: "science-7a-1",
        semester: "7上",
        title: "生命的世界（生物圈・科學探究方法）",
      },
      {
        id: "science-7a-2",
        semester: "7上",
        title: "細胞與生物體的組成層次",
      },
      {
        id: "science-7a-3",
        semester: "7上",
        title: "生物體的營養（酵素・光合作用・消化）",
      },
      {
        id: "science-7a-4",
        semester: "7上",
        title: "生物體的運輸與防禦",
      },
      { id: "science-7b-1", semester: "7下", title: "生物的協調作用（神經・內分泌）" },
      { id: "science-7b-2", semester: "7下", title: "生物的恆定性（呼吸・排泄・體溫）" },
      { id: "science-7b-3", semester: "7下", title: "生殖與遺傳" },
      { id: "science-7b-4", semester: "7下", title: "演化與生物分類" },
      { id: "science-7b-5", semester: "7下", title: "生態系與環境保育" },
    ],
  },
  {
    id: "social",
    name: "社會",
    emoji: "🌏",
    publisher: "康軒",
    tagline: "地理・歷史・公民，看懂你住的世界",
    color: {
      main: "hsl(202 82% 45%)",
      soft: "hsl(202 82% 45% / 0.1)",
      grad: "linear-gradient(135deg, hsl(202 82% 45%), hsl(230 80% 58%))",
    },
    // 康軒社會＝地理／歷史（臺灣史）／公民三軌並行
    topics: [
      {
        id: "social-geo-1",
        semester: "7上",
        title: "地理｜位置與地圖（經緯度・臺灣的位置）",
      },
      { id: "social-geo-2", semester: "7上", title: "地理｜地形與海岸島嶼" },
      { id: "social-geo-3", semester: "7上", title: "地理｜天氣與氣候" },
      {
        id: "social-his-1",
        semester: "7上",
        title: "歷史｜史前文化與臺灣原住民族",
      },
      {
        id: "social-his-2",
        semester: "7上",
        title: "歷史｜大航海時代（荷西・鄭氏）",
      },
      {
        id: "social-his-3",
        semester: "7上",
        title: "歷史｜清帝國統治下的臺灣",
      },
      { id: "social-civ-1", semester: "7上", title: "公民｜自我的成長" },
      { id: "social-civ-2", semester: "7上", title: "公民｜性別平等" },
      { id: "social-civ-3", semester: "7上", title: "公民｜家庭・學校與社區" },
    ],
  },
];

export function getSubject(id: string): Subject | undefined {
  return subjects.find((s) => s.id === id);
}

export function getTopic(topicId: string): SubjectTopic | undefined {
  for (const s of subjects) {
    const t = s.topics.find((t) => t.id === topicId);
    if (t) return t;
  }
  return undefined;
}
