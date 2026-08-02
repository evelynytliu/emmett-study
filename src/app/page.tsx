"use client";

import * as React from "react";
import Link from "next/link";
import { subjects } from "@/content/subjects";
import { contentForSubject } from "@/lib/subject-content";
import { units } from "@/content";
import { getAllProgress, type UnitProgress } from "@/lib/storage";
import { getAllQuizRecords, type QuizRecord } from "@/lib/quiz-storage";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Flame,
  GraduationCap,
  Repeat,
  Sparkles,
  Trophy,
} from "lucide-react";

export default function HomePage() {
  const [unitProgress, setUnitProgress] = React.useState<
    Record<string, UnitProgress>
  >({});
  const [quizRecords, setQuizRecords] = React.useState<
    Record<string, QuizRecord>
  >({});
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const all = await getAllProgress();
      const map: Record<string, UnitProgress> = {};
      for (const p of all) map[p.unitId] = p;
      setUnitProgress(map);
      setQuizRecords(getAllQuizRecords());
      setLoaded(true);
    })();
  }, []);

  // 全站小統計：完成的單元數、做過的題組數、累積答對題數（給「等級感」）
  const stats = React.useMemo(() => {
    const unitsDone = units.filter((u) =>
      Boolean(unitProgress[u.id]?.completedAt),
    ).length;
    const quizList = Object.values(quizRecords);
    const quizzesDone = quizList.length;
    const questionsMastered = quizList.reduce((n, r) => n + r.total, 0);
    return { unitsDone, quizzesDone, questionsMastered };
  }, [unitProgress, quizRecords]);

  // 每科的「已開始」訊號（有做過該科任何題組，或數學有完成單元）
  const subjectContent = React.useMemo(
    () =>
      subjects.map((s) => ({
        subject: s,
        items: contentForSubject(s.id),
      })),
    [],
  );

  return (
    <div className="flex flex-1 flex-col py-8">
      {/* ── Hero ── */}
      <header className="relative mb-7">
        <span
          aria-hidden
          className="float-bob pointer-events-none absolute right-1 top-0 hidden text-4xl opacity-70 sm:block"
        >
          🚀
        </span>
        <span
          aria-hidden
          className="float-bob pointer-events-none absolute right-16 top-9 hidden text-2xl opacity-60 sm:block"
          style={{ animationDelay: "1.6s" }}
        >
          ⚡
        </span>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          自己想、自己寫，才是你的
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="text-gradient">國一學習基地</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
          五科都在這裡——用<strong className="text-foreground">生動的方式</strong>把概念弄懂，
          再做<strong className="text-foreground">線上題目</strong>驗收。
          重點只有一個：用自己的話想出來，不是照背、照抄。
        </p>
      </header>

      {/* ── 我的進度小卡（等級感） ── */}
      {loaded && (
        <div className="mb-8 grid grid-cols-3 gap-3">
          <StatCard
            icon={<GraduationCap className="h-4 w-4" />}
            value={stats.unitsDone}
            label="學完的單元"
          />
          <StatCard
            icon={<Trophy className="h-4 w-4" />}
            value={stats.quizzesDone}
            label="挑戰過的題組"
          />
          <StatCard
            icon={<Flame className="h-4 w-4" />}
            value={stats.questionsMastered}
            label="答對過的題目"
          />
        </div>
      )}

      {/* ── 五科入口 ── */}
      <section className="mb-9">
        <h2 className="mb-3 text-lg font-bold tracking-tight">選一科開始</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {subjectContent.map(({ subject, items }) => (
            <Link
              key={subject.id}
              href={`/subject/${subject.id}`}
              className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              {/* 科目色頂條 */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ background: subject.color.grad }}
              />
              <div className="flex items-start gap-4">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-sm transition-transform group-hover:scale-110"
                  style={{ background: subject.color.soft }}
                >
                  {subject.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold tracking-tight">
                      {subject.name}
                    </h3>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {subject.publisher}版
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {subject.tagline}
                  </p>
                  <div
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium"
                    style={{ color: subject.color.main }}
                  >
                    {items.length} 個學習內容
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 歷史 3D 場景館（獨立入口） ── */}
      <section className="mb-9">
        <Link
          href="/history"
          className="group relative block overflow-hidden rounded-2xl p-5 text-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
          style={{
            background:
              "linear-gradient(135deg, hsl(202 82% 40%), hsl(230 80% 52%))",
          }}
        >
          <span
            aria-hidden
            className="absolute -right-3 -top-5 text-7xl opacity-25 transition-transform group-hover:scale-110"
          >
            🏛️
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-bold">
              NEW
            </span>
            <span className="text-xs font-semibold text-white/80">
              社會・歷史（康軒）
            </span>
          </div>
          <h3 className="mt-2 text-xl font-black tracking-tight">
            歷史 3D 場景館
          </h3>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-white/90">
            走進 3D 歷史現場收集名詞卡：從史前洞穴挖到大航海時代，
            像玩遊戲一樣把課本名詞記起來。
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold">
            進入場景館
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </section>

      {/* ── 數學專屬：完整先修課表 + 螺旋複習 ── */}
      <section className="mb-9">
        <h2 className="mb-3 text-lg font-bold tracking-tight">
          🧮 數學・進階練功房
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/course"
            className="group flex items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-5 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold tracking-tight">完整先修課表</h3>
              <p className="text-sm text-muted-foreground">
                照順序學 → 間隔複習 → 完成自動診斷吸收度
              </p>
            </div>
          </Link>
          <Link
            href="/review"
            className="group flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5 transition-all hover:border-accent/50 hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Repeat className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold tracking-tight">螺旋複習</h3>
              <p className="text-sm text-muted-foreground">
                把學過的概念用新題目混合練一遍
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* ── 暑假作業（次要，但保留） ── */}
      <section>
        <Link
          href="/homework"
          className="group flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <h3 className="font-bold tracking-tight">暑假作業引導</h3>
              <p className="text-sm text-muted-foreground">
                把作業一步步想清楚、打成草稿，再親手抄到作業本上
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
      </section>

      <footer className="mt-10 border-t pt-6 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>進度與你寫的內容會存起來，換裝置也看得到。</p>
          <Link
            href="/parent"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            家長檢視 →
          </Link>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 text-center shadow-sm">
      <div
        className={cn(
          "mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary",
        )}
      >
        {icon}
      </div>
      <div className="mt-2 text-2xl font-black tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
