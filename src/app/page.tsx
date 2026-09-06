"use client";

// 首頁＝學期儀表板：現在在哪（學期、會考倒數）、接下來要考什麼（含考前節奏）、
// 今天該回鍋幾張卡、連續學習天數、五科入口。
// 暑假先修內容移到 /archive；會考路線與讀書法在 /goal。

import * as React from "react";
import Link from "next/link";
import { subjects } from "@/content/subjects";
import { contentForSubject } from "@/lib/subject-content";
import { school, currentPlan, daysUntil, todayIso } from "@/content/school";
import {
  upcomingExams,
  pastExams,
  examPhase,
  resultRate,
  type Exam,
} from "@/content/exams";
import { getAllQuizRecords } from "@/lib/quiz-storage";
import { getPrepPoolLocal, dueCount } from "@/lib/prep-storage";
import { getStreak, lastSevenDays, type Streak } from "@/lib/streak";
import { cn } from "@/lib/utils";
import {
  Archive,
  ArrowRight,
  CalendarDays,
  Flame,
  History,
  Landmark,
  Map as MapIcon,
  RotateCcw,
  Trophy,
} from "lucide-react";

const SUBJECT_LABEL: Record<string, string> = {
  chinese: "國文",
  math: "數學",
  english: "英文",
  science: "自然",
  social: "社會",
  全科: "全科",
};

export default function HomePage() {
  const [today, setToday] = React.useState<string | null>(null);
  const [due, setDue] = React.useState(0);
  const [streak, setStreak] = React.useState<Streak | null>(null);
  const [quizzesDone, setQuizzesDone] = React.useState(0);
  const [questionsMastered, setQuestionsMastered] = React.useState(0);

  React.useEffect(() => {
    setToday(todayIso());
    setDue(dueCount(getPrepPoolLocal()));
    setStreak(getStreak());
    const recs = Object.values(getAllQuizRecords());
    setQuizzesDone(recs.length);
    setQuestionsMastered(recs.reduce((n, r) => n + r.bestFirstTry, 0));
  }, []);

  const plan = currentPlan();
  const exams: Exam[] = today ? upcomingExams(today) : [];
  const recent: Exam[] = today ? pastExams(today).slice(0, 3) : [];
  const countdown = today ? daysUntil(school.target.date) : null;
  const week = streak && today ? lastSevenDays(streak, today) : [];

  const subjectContent = React.useMemo(
    () => subjects.map((s) => ({ subject: s, items: contentForSubject(s.id) })),
    [],
  );

  return (
    <div className="flex flex-1 flex-col py-8">
      {/* ── Hero ── */}
      <header className="mb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">
            {school.student} 學習基地・{school.currentSemester}
          </span>
          <span className="text-muted-foreground">{school.schoolName}</span>
          {streak && streak.count > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 font-bold text-accent">
              <Flame className="h-3.5 w-3.5" />
              連續 {streak.count} 天
              {streak.best > streak.count && (
                <span className="font-normal text-muted-foreground">・最長 {streak.best}</span>
              )}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">今天讀什麼？</h1>
        <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
          先做回鍋的卡片，再讀最近要考的範圍。每一頁都是：先遮答案、自己想、再翻開對。
        </p>
        {week.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5" aria-label="最近七天">
            {week.map((d, i) => (
              <span
                key={d.date}
                title={d.date}
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  d.done ? "bg-accent" : "bg-border",
                  i === week.length - 1 && "ring-2 ring-accent/30",
                )}
              />
            ))}
            <span className="ml-1 text-[11px] text-muted-foreground">
              最近 7 天有做事的日子
            </span>
          </div>
        )}
      </header>

      {/* ── 三格：會考倒數 / 該回鍋 / 下一次考試 ── */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Link
          href="/goal"
          className="group rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground">
            會考倒數
          </div>
          <div className="mt-1 text-4xl font-black tabular-nums tracking-tight text-primary">
            {countdown ?? "—"}
            <span className="ml-1 text-sm font-bold text-muted-foreground">天</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            目標 {school.target.school}
            {school.target.estimated && "・日期預估"}
          </div>
        </Link>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground">
            今天該回鍋
          </div>
          <div
            className={cn(
              "mt-1 text-4xl font-black tabular-nums tracking-tight",
              due > 0 ? "text-gentle-foreground" : "text-correct",
            )}
          >
            {due}
            <span className="ml-1 text-sm font-bold text-muted-foreground">張卡</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {due > 0 ? "到各科複習頁按「只練沒會的」" : "沒有到期的，去讀新範圍"}
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground">
            下一次考試
          </div>
          {exams[0] ? (
            <>
              <div className="mt-1 text-4xl font-black tabular-nums tracking-tight">
                {daysUntil(exams[0].date)}
                <span className="ml-1 text-sm font-bold text-muted-foreground">天</span>
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {SUBJECT_LABEL[exams[0].subject]}・{exams[0].name}
              </div>
            </>
          ) : (
            <>
              <div className="mt-1 text-4xl font-black tracking-tight text-muted-foreground">
                —
              </div>
              <div className="mt-1 text-xs text-muted-foreground">還沒排定考試</div>
            </>
          )}
        </div>
      </div>

      {/* ── 接下來要考 ── */}
      <section className="mb-9">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">接下來要考</h2>
        </div>
        {exams.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
            還沒有排定的考試。學校公布日期後，請媽媽用 Claude Code 說「X 月 X 日要考 XX」。
          </div>
        ) : (
          <div className="space-y-2">
            {exams.slice(0, 5).map((e) => {
              const subj = subjects.find((s) => s.id === e.subject);
              const d = daysUntil(e.date);
              const phase = examPhase(d);
              return (
                <div key={e.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={
                        subj ? { background: subj.color.soft, color: subj.color.main } : undefined
                      }
                    >
                      {SUBJECT_LABEL[e.subject]}・{e.kind}
                    </span>
                    <span className="font-bold">{e.name}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {e.date}・{d === 0 ? "今天" : `${d} 天後`}
                    </span>
                  </div>
                  {e.scope && (
                    <div className="mt-1 text-xs text-muted-foreground">範圍：{e.scope}</div>
                  )}
                  <div className="mt-2 flex items-start gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-sm">
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
                      {phase.label}
                    </span>
                    <span className="text-muted-foreground">{phase.hint}</span>
                  </div>
                  {e.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {e.links.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-sm font-bold transition-colors hover:border-primary/50"
                          style={subj ? { color: subj.color.main } : undefined}
                        >
                          {l.title}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 最近考過（成績＋錯題回鍋） ── */}
      {recent.length > 0 && (
        <section className="mb-9">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-bold tracking-tight">最近考過</h2>
          </div>
          <div className="space-y-2">
            {recent.map((e) => {
              const subj = subjects.find((s) => s.id === e.subject);
              const r = e.result;
              const rate = resultRate(r);
              return (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card px-4 py-3 shadow-sm"
                >
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold"
                    style={
                      subj ? { background: subj.color.soft, color: subj.color.main } : undefined
                    }
                  >
                    {SUBJECT_LABEL[e.subject]}・{e.kind}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{e.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{e.date}</span>
                  {r ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-bold",
                        rate === null
                          ? "bg-secondary text-muted-foreground"
                          : rate >= 0.9
                            ? "bg-correct/15 text-correct"
                            : rate >= 0.7
                              ? "bg-accent/15 text-accent"
                              : "bg-gentle/20 text-gentle-foreground",
                      )}
                    >
                      {r.score !== undefined
                        ? `${r.score} / ${r.total ?? 100}`
                        : (r.grade ?? "已考")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      成績待登記
                    </span>
                  )}
                  {r?.mistakesQuizId && (
                    <Link
                      href={`/quiz/${r.mistakesQuizId}`}
                      className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold text-primary transition-colors hover:border-primary/50"
                    >
                      錯題回鍋 <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 五科入口 ── */}
      <section className="mb-9">
        <h2 className="mb-3 text-lg font-bold tracking-tight">五科基地</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {subjectContent.map(({ subject, items }) => {
            const active = items.filter((i) => !i.archived).length;
            return (
              <Link
                key={subject.id}
                href={`/subject/${subject.id}`}
                className="group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: subject.color.grad }}
                />
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ background: subject.color.soft }}
                  >
                    {subject.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black tracking-tight">{subject.name}</h3>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                        {subject.publisher}版
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {active} 個學習內容
                      {items.length - active > 0 && `・先修 ${items.length - active}`}
                    </div>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: subject.color.main }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 這學期 ── */}
      <section className="mb-9 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">
            {school.currentSemester}・這學期的重點
          </h2>
        </div>
        <p className="mt-2 text-[15px] font-bold leading-snug">{plan.focus}</p>
        <p className="mt-1 text-sm text-muted-foreground">自然：{plan.science}</p>
        <p className="mt-2 text-sm text-primary">「{plan.advice}」</p>
        <Link
          href="/goal"
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary"
        >
          看完整三年路線與會考說明 <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* ── 其他入口 ── */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/hanzi"
          className="group flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <Flame className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <div className="font-bold">形音義每日 10 字</div>
            <div className="text-xs text-muted-foreground">國文基本功，天天練</div>
          </div>
        </Link>
        <Link
          href="/history"
          className="group flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <Landmark className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <div className="font-bold">歷史 3D 場景館</div>
            <div className="text-xs text-muted-foreground">走進臺灣史現場收集名詞卡</div>
          </div>
        </Link>
        <Link
          href="/archive"
          className="group flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <Archive className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="font-bold">封存・暑假先修</div>
            <div className="text-xs text-muted-foreground">數學五段式單元、課表、暑假作業</div>
          </div>
        </Link>
      </section>

      <footer className="mt-10 border-t pt-6 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Trophy className="h-4 w-4" /> 題組 {quizzesDone}
            </span>
            <span className="inline-flex items-center gap-1">
              <RotateCcw className="h-4 w-4" /> 一次就對 {questionsMastered} 題
            </span>
          </p>
          <Link href="/parent" className="underline-offset-4 hover:text-foreground hover:underline">
            家長檢視 →
          </Link>
        </div>
      </footer>
    </div>
  );
}
