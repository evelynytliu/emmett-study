// 形音義・第一週・星期一（字音）
import type { HanziSet } from "./types";

export const hanziW1D1: HanziSet = {
  id: "hanzi-w1-d1",
  title: "第一週・星期一",
  subtitle: "破音字與易讀錯的字音（葛、矇、波濤、創、揩……）",
  kind: "zhuyin",
  order: 1,
  questions: [
    {
      id: "q1",
      kind: "zhuyin",
      sentence:
        "三個臭皮匠，勝過一個諸【葛】亮——大家一起討論，總能想出好辦法。",
      answer: "ㄍㄜˊ",
      explanation:
        "諸葛是複姓（諸葛亮＝三國蜀漢的軍師），複姓「諸葛」的葛讀ㄍㄜˊ；「葛」單獨當姓氏時才讀ㄍㄜˇ。",
      concept: "姓氏音：葛（諸葛ㄍㄜˊ／單姓ㄍㄜˇ）",
    },
    {
      id: "q2",
      kind: "zhuyin",
      sentence: "這家公司秉持良心經營，絕不用劣質商品【矇】騙顧客。",
      answer: "ㄇㄥˊ",
      explanation: "矇騙＝欺騙。矇讀ㄇㄥˊ（二聲），不讀一聲ㄇㄥ。",
      concept: "易讀錯：矇（ㄇㄥˊ）",
    },
    {
      id: "q3a",
      kind: "zhuyin",
      sentence: "海面上【波】濤洶湧，岸邊觀浪的群眾驚呼連連。",
      answer: "ㄅㄛ",
      explanation: "波讀ㄅㄛ（一聲），不讀ㄆㄛ。波濤洶湧＝形容波浪很大。",
      concept: "易讀錯：波（ㄅㄛ）",
    },
    {
      id: "q3b",
      kind: "zhuyin",
      sentence: "海面上波【濤】洶湧，岸邊觀浪的群眾驚呼連連。",
      answer: "ㄊㄠˊ",
      explanation: "濤讀ㄊㄠˊ（二聲），不讀一聲ㄊㄠ。濤＝大浪。",
      concept: "易讀錯：濤（ㄊㄠˊ）",
    },
    {
      id: "q4",
      kind: "zhuyin",
      sentence: "這起車禍中，駕駛只受到輕微的【創】傷，算是不幸中的大幸。",
      answer: "ㄔㄨㄤ",
      explanation:
        "「創」當「外傷」講讀ㄔㄨㄤ（創傷、創口）；當「開始、製造」講才讀ㄔㄨㄤˋ（創造、開創）。",
      concept: "破音字：創（ㄔㄨㄤ＝傷）",
    },
    {
      id: "q5",
      kind: "zhuyin",
      sentence: "他利用採購的機會從中【揩】油，被檢方依貪汙罪起訴。",
      answer: "ㄎㄞ",
      explanation: "揩油＝用不正當手段占便宜、撈好處。揩讀ㄎㄞ（一聲）。",
      concept: "易讀錯：揩（ㄎㄞ）",
    },
    {
      id: "q6",
      kind: "zhuyin",
      sentence: "媒體未經查證就過度【渲】染這起事件，侵害了當事人的隱私。",
      answer: "ㄒㄩㄢˋ",
      explanation: "渲染＝誇大地形容、鋪陳。渲讀ㄒㄩㄢˋ（四聲），不讀一聲。",
      concept: "易讀錯：渲（ㄒㄩㄢˋ）",
    },
    {
      id: "q7",
      kind: "zhuyin",
      sentence: "有些人生活豪奢，就算餐餐龍肝鳳【髓】也難以滿足。",
      answer: "ㄙㄨㄟˇ",
      explanation:
        "龍肝鳳髓＝比喻極珍貴難得的美食。髓讀ㄙㄨㄟˇ（三聲），不讀ㄙㄨㄟˊ。",
      concept: "易讀錯：髓（ㄙㄨㄟˇ）",
    },
    {
      id: "q8",
      kind: "zhuyin",
      sentence: "丈夫遠行後音信【杳】然，令她十分擔憂。",
      answer: "ㄧㄠˇ",
      explanation:
        "音信杳然＝完全沒有消息。杳讀ㄧㄠˇ，注意字形是「木＋日」，別跟「查」搞混。",
      concept: "易讀錯：杳（ㄧㄠˇ）",
    },
    {
      id: "q9",
      kind: "zhuyin",
      sentence: "那些流氓【橫】行霸道、欺壓百姓，終於受到法律制裁。",
      answer: "ㄏㄥˋ",
      explanation:
        "「橫」表示蠻橫、凶暴時讀ㄏㄥˋ（橫行、蠻橫）；表示方向（橫線、橫躺）才讀ㄏㄥˊ。",
      concept: "破音字：橫（ㄏㄥˋ＝蠻橫）",
    },
    {
      id: "q10",
      kind: "zhuyin",
      sentence: "他不聽朋友的忠【告】，如今吃了大虧，後悔莫及。",
      answer: "ㄍㄠˋ",
      explanation: "忠告＝真心誠意的規勸。告讀ㄍㄠˋ，不讀ㄍㄨˋ。",
      concept: "易讀錯：告（ㄍㄠˋ）",
    },
  ],
};
