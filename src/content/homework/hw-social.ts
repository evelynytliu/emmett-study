// src/content/homework/hw-social.ts
// 社會科：我的成長小書（暑假作業 3 面）
//
// 作業要求：把自己的成長分成六個階段，每個階段
//   - 一個 10 字以內的「標題」
//   - 100 字以上的純文字敘述（若有搭配照片或插圖，則 50 字以上）
// 作業鼓勵：去問最了解你的家人，關於自己每個階段的細節，藉此更認識自己。
//
// 提示用「不同的回憶角度」+「去問家人」破除空白頁，內容是他自己的人生，
// 只有他（和家人）寫得出來。

import type { DraftHomework, DraftField } from "./types";

// 六個成長階段（照作業本上的分法：幼兒期／孩童期／低年級／中年級／高年級／國中）
//
// ⚠️ key 是草稿的儲存欄位名，已經寫過的內容都掛在上面，改了他寫的東西就不見了。
// 2026-08-19 修正階段名稱時刻意沿用 toddler/preschool/lower/upper 這四個 key，
// 原本多出來的 baby（嬰兒時期）與 now 沒有對應階段、也沒有內容，直接移除。
const STAGES: { key: string; name: string; age: string }[] = [
  { key: "toddler", name: "幼兒期", age: "上幼兒園之前，還是小小孩" },
  { key: "preschool", name: "孩童期", age: "幼兒園那幾年" },
  { key: "lower", name: "低年級", age: "一、二年級" },
  { key: "upper", name: "中年級", age: "三、四年級" },
  { key: "senior", name: "高年級", age: "五、六年級" },
  { key: "junior", name: "國中", age: "現在的你，正要上國一" },
];

// 敘述用的回憶角度（不同的切入點，點一下幫他開頭）
function storySparks(): string[] {
  return [
    "那時候我住在＿＿，家裡有＿＿",
    "我最喜歡（或最常做）的事情是＿＿",
    "這個階段發生過一件大事：＿＿",
    "我去問了家人，他們說我那時候＿＿（問一件你自己不記得的事）",
    "跟現在比起來，那時候的我＿＿",
    "有一件到現在想起來還是會笑（或印象很深）的事：＿＿",
  ];
}

// 標題用的取名角度（要 10 字以內、是他自己的）
function titleSparks(): string[] {
  return [
    "用一句話形容那時候的你（例：『什麼都想摸的小手』）",
    "用那時候你最愛的東西當標題（例：『離不開的小熊』）",
    "用那階段的一個綽號或外號",
  ];
}

function stageFields(stage: {
  key: string;
  name: string;
  age: string;
}): DraftField[] {
  return [
    {
      id: `${stage.key}-title`,
      label: `${stage.name}・小標題（10 字以內）`,
      guide: `給「${stage.name}（${stage.age}）」這個階段取一個 10 字以內的標題，要有你自己的味道，不要只寫「嬰兒時期」這種。`,
      type: "short",
      placeholder: "10 字以內的小標題…",
      sparks: titleSparks(),
      aiContext: `孩子要為成長階段「${stage.name}」取一個 10 字以內、有個人特色的標題。`,
    },
    {
      id: `${stage.key}-story`,
      label: `${stage.name}・這個階段的我（100 字以上）`,
      guide: `寫一段這個階段的你，100 字以上（如果你會在作業上貼照片或畫插圖，這段 50 字以上就行）。記不得的部分，去問爸媽、阿公阿嬤——這也是這份作業的重點。`,
      type: "long",
      placeholder: "從一個你記得（或家人告訴你）的小細節開始寫…",
      minChars: 100,
      sparks: storySparks(),
      aiContext: `孩子要寫成長階段「${stage.name}（${stage.age}）」的 100 字敘述。判斷他是否寫出具體的回憶或細節（而非空泛地說「我很可愛」），有沒有把家人提供的細節寫進去。`,
    },
  ];
}

export const socialGrowthHomework: DraftHomework = {
  id: "hw-social-growth",
  subject: "社會",
  subjectEmoji: "🌱",
  title: "我的成長小書",
  order: 5,
  kind: "draft",
  aiCoach: true,
  pdfNote: "暑假作業・社會科 我的成長小書（3 面）",
  intro: [
    "這份作業要你做一本『成長小書』：把自己從小到大分成六個階段，每個階段寫一個小標題、再寫一段這個階段的你。",
    "很多小時候的事你自己不記得了——這正是這份作業最棒的地方：去問最了解你的爸媽、阿公阿嬤，你會發現好多你不知道的故事。",
    "每段至少 100 字（如果有貼照片或插圖，50 字也可以）。下面有不同的『回憶角度』可以挑，幫你想起更多。",
  ],
  paperNote:
    "作業本上有六格（六個階段），每格要寫標題 + 敘述，可以配照片或插圖。先在這裡把六段都寫好、問好家人，再抄到小書上、貼上照片。",
  assembleHeading: "我的成長小書・草稿",
  fields: STAGES.flatMap(stageFields),
};
