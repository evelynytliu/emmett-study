// src/content/school.ts
// 學習基地的「學年設定」——首頁倒數、目前學期、三年路線圖都吃這一份。
// 每學期開學時只要改 currentSemester；會考日期確定後把 estimated 改成 false。

export type Semester = "7上" | "7下" | "8上" | "8下" | "9上" | "9下";

export const school = {
  student: "Emmett",
  schoolName: "竹光國中",
  currentSemester: "7上" as Semester,
  target: {
    school: "新竹高中",
    exam: "國中教育會考",
    // 118 學年會考：依往年慣例在 5 月第三個週末。教育部公告後改成正式日期。
    date: "2029-05-19",
    estimated: true,
  },
};

// 三年路線圖：每個學期的重點。首頁與 /goal 會顯示目前所在位置。
export interface SemesterPlan {
  semester: Semester;
  from: string; // 學期起點（YYYY-MM）
  focus: string; // 這學期的主軸（一句）
  science: string; // 自然科這學期學什麼（七年級生物、八年級理化、九年級理化＋地科）
  advice: string; // 給孩子的一句提醒
}

export const roadmap: SemesterPlan[] = [
  {
    semester: "7上",
    from: "2026-09",
    focus: "把「先遮答案、自己想」變成習慣；每次小考前都用複習頁過一遍。",
    science: "生物：科學方法、細胞、營養與運輸",
    advice: "七年級的分數不重要，習慣才重要。錯的題目要留下來。",
  },
  {
    semester: "7下",
    from: "2027-02",
    focus: "數學二元一次、坐標、比例——這些是八年級的地基。",
    science: "生物：協調、恆定、生殖遺傳、演化、生態",
    advice: "每個單元學完，用嘴巴講一次給家人聽。",
  },
  {
    semester: "8上",
    from: "2027-09",
    focus: "理化開始：物理量、光、聲、溫度熱。數學乘法公式、根號、畢氏定理。",
    science: "理化：基本測量、波動與聲音、光、溫度與熱",
    advice: "理化是會考自然最多分的地方，公式要能推導不是背。",
  },
  {
    semester: "8下",
    from: "2028-02",
    focus: "化學反應、電解質、有機。數學幾何證明起步。",
    science: "理化：元素與化合物、化學反應、氧化還原、酸鹼",
    advice: "開始寫「一頁總結」：每章用一張紙講完。",
  },
  {
    semester: "9上",
    from: "2028-09",
    focus: "九年級新課＋開始總複習。第一次模擬考通常在 10–11 月。",
    science: "理化：力與運動、電、電磁；地科：地球、天氣",
    advice: "模擬考是拿來找洞的，不是拿來難過的。",
  },
  {
    semester: "9下",
    from: "2029-02",
    focus: "全面總複習、寫作練習、按模擬考弱點補洞，5 月會考。",
    science: "地科：天文、地質；全科總複習",
    advice: "最後三個月：只做錯題與弱單元，睡飽。",
  },
];

export function currentPlan(): SemesterPlan {
  return (
    roadmap.find((r) => r.semester === school.currentSemester) ?? roadmap[0]
  );
}

// 距離某一天還有幾天（以當地日曆日計算）
export function daysUntil(iso: string, now = new Date()): number {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = iso.split("-").map(Number);
  const b = new Date(y, m - 1, d);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
