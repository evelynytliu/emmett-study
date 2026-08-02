// 形音義・第一週・星期二（字音）
import type { HanziSet } from "./types";

export const hanziW1D2: HanziSet = {
  id: "hanzi-w1-d2",
  title: "第一週・星期二",
  subtitle: "破音字大集合（間、蹈、倔強、識、泥、惡、與……）",
  kind: "zhuyin",
  order: 2,
  questions: [
    {
      id: "q1a",
      kind: "zhuyin",
      sentence: "人與人之間的誤會，往往是第三者【挑】撥離間造成的。",
      answer: "ㄊㄧㄠˇ",
      explanation:
        "「挑」表示煽動、引起時讀ㄊㄧㄠˇ（挑撥、挑戰）；表示用肩擔物才讀ㄊㄧㄠ（挑水）。",
      concept: "破音字：挑（ㄊㄧㄠˇ＝煽動）",
    },
    {
      id: "q1b",
      kind: "zhuyin",
      sentence: "人與人之間的誤會，往往是第三者挑撥離【間】造成的。",
      answer: "ㄐㄧㄢˋ",
      explanation:
        "挑撥離間＝搬弄是非、分化感情，使人互相猜忌。「間」表示挑撥、隔開時讀ㄐㄧㄢˋ；表示中間、之間才讀ㄐㄧㄢ。",
      concept: "破音字：間（ㄐㄧㄢˋ＝離間）",
    },
    {
      id: "q2",
      kind: "zhuyin",
      sentence: "一向循規【蹈】矩的王同學突然變了樣，讓師長十分不解。",
      answer: "ㄉㄠˋ",
      explanation: "循規蹈矩＝遵守規矩。蹈讀ㄉㄠˋ（四聲），不讀ㄉㄠˇ。",
      concept: "易讀錯：蹈（ㄉㄠˋ）",
    },
    {
      id: "q3a",
      kind: "zhuyin",
      sentence: "弟弟個性【倔】強，多年來家人始終無法改變他。",
      answer: "ㄐㄩㄝˊ",
      explanation: "倔強＝強硬不肯屈服的樣子。倔讀ㄐㄩㄝˊ。",
      concept: "易讀錯：倔（ㄐㄩㄝˊ）",
    },
    {
      id: "q3b",
      kind: "zhuyin",
      sentence: "弟弟個性倔【強】，多年來家人始終無法改變他。",
      answer: "ㄐㄧㄤˋ",
      explanation:
        "「強」在「倔強」裡讀ㄐㄧㄤˋ（固執不服），不讀ㄑㄧㄤˊ（強壯）也不讀ㄑㄧㄤˇ（勉強）。",
      concept: "破音字：強（ㄐㄧㄤˋ＝倔強）",
    },
    {
      id: "q4",
      kind: "zhuyin",
      sentence: "李教授學養豐富、博聞強【識】，是人人敬重的學者。",
      answer: "ㄓˋ",
      explanation:
        "博聞強識＝見聞廣博、記憶力好。「識」當「記住」講讀ㄓˋ，不讀ㄕˋ（認識）。",
      concept: "破音字：識（ㄓˋ＝記）",
    },
    {
      id: "q5",
      kind: "zhuyin",
      sentence: "如果做事太拘【泥】小節，就容易綁手綁腳。",
      answer: "ㄋㄧˋ",
      explanation:
        "拘泥＝固執而不知變通。「泥」當「固執」講讀ㄋㄧˋ，不讀ㄋㄧˊ（泥土）。",
      concept: "破音字：泥（ㄋㄧˋ＝拘泥）",
    },
    {
      id: "q6",
      kind: "zhuyin",
      sentence: "種【子】播下沒幾天就發芽了，真令人驚喜！",
      answer: "ㄗˇ",
      explanation:
        "種子的「子」讀本音ㄗˇ（植物的胚珠發育成熟的部分），不讀輕聲。",
      concept: "易讀錯：子（ㄗˇ）",
    },
    {
      id: "q7",
      kind: "zhuyin",
      sentence: "你一直糾纏他，究竟有【什】麼企圖？",
      answer: "ㄕㄣˊ",
      explanation:
        "什麼＝疑問詞。「什」在「什麼」裡讀ㄕㄣˊ；在「什錦」「家什」等詞裡才讀ㄕˊ。",
      concept: "破音字：什（ㄕㄣˊ＝什麼）",
    },
    {
      id: "q8",
      kind: "zhuyin",
      sentence: "兩家人因停車問題交【惡】多年，至今不相往來。",
      answer: "ㄨˋ",
      explanation:
        "交惡＝彼此憎恨仇視。「惡」當「討厭、憎恨」講讀ㄨˋ（可惡、厭惡）；當「壞」講才讀ㄜˋ（惡人）。",
      concept: "破音字：惡（ㄨˋ＝憎恨）",
    },
    {
      id: "q9",
      kind: "zhuyin",
      sentence: "儘管有人冷嘲熱【諷】，他仍不放棄出國進修的夢想。",
      answer: "ㄈㄥˋ",
      explanation:
        "冷嘲熱諷＝尖酸刻薄地嘲笑諷刺。諷讀ㄈㄥˋ（四聲），不讀一聲ㄈㄥ。",
      concept: "易讀錯：諷（ㄈㄥˋ）",
    },
    {
      id: "q10",
      kind: "zhuyin",
      sentence: "這次淨灘活動，歡迎同學踴躍參【與】，一起守護海洋。",
      answer: "ㄩˋ",
      explanation:
        "參與＝加入、參加。「與」當「參加」講讀ㄩˋ，不讀ㄩˇ（給與、和）。",
      concept: "破音字：與（ㄩˋ＝參與）",
    },
  ],
};
