"use client";

import * as React from "react";
import Link from "next/link";
import { school, roadmap, daysUntil } from "@/content/school";
import { cn } from "@/lib/utils";
import { ArrowLeft, Flag, Target } from "lucide-react";

// 會考地圖：目標、三年路線、會考長什麼樣、怎麼讀。給孩子看，也給家長對齊。

const examSubjects = [
  { name: "國文", note: "閱讀理解為主；另有寫作測驗（1～6 級分）" },
  { name: "英語", note: "閱讀＋聽力" },
  { name: "數學", note: "選擇題＋非選擇題（要寫過程）" },
  { name: "社會", note: "地理・歷史・公民，圖表題多" },
  { name: "自然", note: "生物・理化・地科，實驗與圖表題多" },
];

const methods = [
  {
    title: "先遮答案，再翻開",
    body: "看到重點先在心裡答，翻開才對。讀十遍不如自己答一遍——這個網站每一頁都這樣設計。",
  },
  {
    title: "錯的才是分數來源",
    body: "答錯的卡片會自動回鍋（1、3、7、14、30 天）。考前只做回鍋的，不要從頭全部再看。",
  },
  {
    title: "用嘴巴講一次",
    body: "每個單元學完，把課本闔上，跟家人講一次「為什麼」。講不出來 = 還在背。",
  },
  {
    title: "一頁總結",
    body: "八年級起每章寫一頁總結。九年級總複習就是把這些頁再看一遍，不是重讀課本。",
  },
];

export default function GoalPage() {
  const [days, setDays] = React.useState<number | null>(null);
  React.useEffect(() => setDays(daysUntil(school.target.date)), []);

  return (
    <div className="flex flex-1 flex-col py-8">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        回學習基地
      </Link>

      <header className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Target className="h-3.5 w-3.5" />
          目標・{school.target.school}
        </div>
        <h1 className="text-3xl font-black tracking-tight">會考地圖</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          三年是一條路，不是一場考試。先看清楚路，每學期只做該做的事。
        </p>
        <div className="mt-5 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="font-mono text-xs font-bold tracking-widest text-muted-foreground">
            距離{school.target.exam}
          </div>
          <div className="mt-1 text-5xl font-black tracking-tight text-primary tabular-nums">
            {days === null ? "—" : days}
            <span className="ml-2 text-base font-bold text-muted-foreground">天</span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {school.target.estimated ? "預估 " : ""}
            {school.target.date}
            {school.target.estimated && "（教育部公告後會改成正式日期）"}
          </div>
        </div>
      </header>

      {/* 三年路線 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-black tracking-tight">三年路線圖</h2>
        <ol className="relative space-y-3 border-l-2 border-border pl-5">
          {roadmap.map((r) => {
            const now = r.semester === school.currentSemester;
            return (
              <li key={r.semester} className="relative">
                <span
                  className={cn(
                    "absolute -left-[27px] top-4 h-3.5 w-3.5 rounded-full border-2 bg-background",
                    now ? "border-primary bg-primary" : "border-border",
                  )}
                />
                <div
                  className={cn(
                    "rounded-2xl border bg-card p-4 shadow-sm",
                    now && "border-primary/50 ring-2 ring-primary/15",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-black">{r.semester}</span>
                    <span className="font-mono text-xs text-muted-foreground">{r.from}</span>
                    {now && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
                        現在
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[15px] font-bold leading-snug">{r.focus}</p>
                  <p className="mt-1 text-sm text-muted-foreground">自然：{r.science}</p>
                  <p className="mt-1.5 text-sm text-primary">「{r.advice}」</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 會考長什麼樣 */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-black tracking-tight">會考長什麼樣</h2>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm leading-relaxed text-muted-foreground">
            五科各分 A++、A+、A、B++、B+、B、C 七個等級，寫作測驗 1～6 級分。
            竹苗區免試入學以「積分」比序；{school.target.school}
            近年需要幾乎全 A 且多科 ++。正式門檻每年不同，
            <strong className="text-foreground">請以竹苗區免試入學委員會公布為準</strong>。
          </p>
          <ul className="mt-4 space-y-2">
            {examSubjects.map((s) => (
              <li key={s.name} className="flex gap-3 text-[15px]">
                <span className="w-10 shrink-0 font-black">{s.name}</span>
                <span className="text-muted-foreground">{s.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 怎麼讀 */}
      <section>
        <h2 className="mb-3 text-xl font-black tracking-tight">怎麼讀，才不是在背</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {methods.map((m) => (
            <div key={m.title} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 font-black">
                <Flag className="h-4 w-4 text-primary" />
                {m.title}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
