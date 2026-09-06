"use client";

// 家長頁最上面的「學校考試」區：接下來要考幾場、最近考過的成績走勢（各科）、
// 考試錯過的概念彙整（來自 exams.ts 的 result）。純資料，不碰儲存層。

import * as React from "react";
import Link from "next/link";
import { subjects } from "@/content/subjects";
import { exams, pastExams, upcomingExams, resultRate } from "@/content/exams";
import { daysUntil, todayIso } from "@/content/school";
import { cn } from "@/lib/utils";
import { ArrowRight, CalendarDays, Target, TrendingUp } from "lucide-react";

const SUBJECT_LABEL: Record<string, string> = {
  chinese: "國文",
  math: "數學",
  english: "英文",
  science: "自然",
  social: "社會",
  全科: "全科",
};

function rateClass(rate: number | null) {
  if (rate === null) return "bg-secondary text-muted-foreground";
  if (rate >= 0.9) return "bg-correct/15 text-correct";
  if (rate >= 0.7) return "bg-accent/15 text-accent";
  return "bg-gentle/20 text-gentle-foreground";
}

export function ExamParentSummary() {
  const [today, setToday] = React.useState<string | null>(null);
  React.useEffect(() => setToday(todayIso()), []);
  if (!today || exams.length === 0) return null;

  const upcoming = upcomingExams(today);
  const past = pastExams(today);
  const withResult = past.filter((e) => e.result);
  const pending = past.filter((e) => !e.result);

  // 各科成績走勢（舊 → 新）
  const bySubject = subjects
    .map((s) => ({
      subject: s,
      rows: withResult
        .filter((e) => e.subject === s.id)
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .filter((x) => x.rows.length > 0);

  // 錯的概念彙整（跨科），出現次數多的在前
  const weakMap = new Map<string, { count: number; subject: string }>();
  for (const e of withResult) {
    for (const w of e.result?.weak ?? []) {
      const prev = weakMap.get(w);
      weakMap.set(w, { count: (prev?.count ?? 0) + 1, subject: e.subject });
    }
  }
  const weak = Array.from(weakMap.entries())
    .map(([concept, v]) => ({ concept, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold tracking-tight">學校考試</h2>
      </div>

      {upcoming.length > 0 && (
        <div className="mb-3 rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            接下來 {upcoming.length} 場
          </p>
          <ul className="mt-2 space-y-1.5">
            {upcoming.slice(0, 5).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-mono text-xs text-muted-foreground">{e.date}</span>
                <span className="font-bold">
                  {SUBJECT_LABEL[e.subject]}・{e.kind}・{e.name}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {daysUntil(e.date)} 天後
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-3 rounded-2xl border border-dashed bg-card/60 p-4 text-sm text-muted-foreground">
          {pending.length} 場考完還沒登記成績：
          {pending
            .slice(0, 3)
            .map((e) => ` ${e.date} ${SUBJECT_LABEL[e.subject]}「${e.name}」`)
            .join("、")}
          。跟 Claude Code 說「登記 X 月 X 日 XX 考 N 分」即可（skill: after-exam）。
        </div>
      )}

      {bySubject.length > 0 && (
        <div className="space-y-3">
          {bySubject.map(({ subject, rows }) => {
            const valid = rows
              .map((e) => resultRate(e.result))
              .filter((r): r is number => r !== null);
            const avg = valid.length
              ? valid.reduce((a, b) => a + b, 0) / valid.length
              : null;
            return (
              <div key={subject.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                      style={{ background: subject.color.soft }}
                    >
                      {subject.emoji}
                    </span>
                    <div>
                      <p className="font-bold">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{rows.length} 場有成績</p>
                    </div>
                  </div>
                  {avg !== null && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold",
                        rateClass(avg),
                      )}
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      平均 {Math.round(avg * 100)}%
                    </span>
                  )}
                </div>
                <ul className="mt-3 space-y-1.5 border-t pt-3">
                  {rows.map((e) => {
                    const r = e.result;
                    if (!r) return null;
                    const rate = resultRate(r);
                    return (
                      <li key={e.id} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-muted-foreground">{e.date}</span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">
                          {e.kind}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{e.name}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-bold",
                            rateClass(rate),
                          )}
                        >
                          {r.score !== undefined
                            ? `${r.score}/${r.total ?? 100}`
                            : (r.grade ?? "—")}
                        </span>
                        {r.mistakesQuizId && (
                          <Link
                            href={`/quiz/${r.mistakesQuizId}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary"
                          >
                            錯題回鍋 <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                        {r.note && (
                          <span className="w-full text-xs text-muted-foreground">{r.note}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {weak.length > 0 && (
        <div className="mt-3 rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            考試錯過的概念（出現愈多次愈該補）
          </p>
          <div className="flex flex-wrap gap-1.5">
            {weak.map((w) => (
              <span
                key={w.concept}
                className="inline-flex items-center gap-1 rounded-lg bg-gentle/10 px-2.5 py-1 text-xs text-gentle-foreground"
              >
                <Target className="h-3 w-3" />
                {SUBJECT_LABEL[w.subject]}・{w.concept}
                {w.count > 1 && <span className="font-semibold">×{w.count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
