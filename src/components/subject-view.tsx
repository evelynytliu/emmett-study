"use client";

// 單一科目的「學習基地」頁：科目主色頭 + 內容清單 + 課本章節地圖。
// 內容清單直接吃 subject-content 的統一卡片；章節地圖顯示哪些章已有內容。

import * as React from "react";
import Link from "next/link";
import type { Subject } from "@/content/subjects";
import type { ContentItem } from "@/lib/subject-content";
import { cn } from "@/lib/utils";
import { getQuizRecord } from "@/lib/quiz-storage";
import { getHanziPoolLocal } from "@/lib/hanzi-storage";
import { allHanziQuestions } from "@/content/hanzi";
import { school, roadmap, gradeLabel } from "@/content/school";

// 科目頁只需要這三個欄位（題組與形音義的紀錄共用同一形狀）
// 形音義題庫卡：bestFirstTry 放「已精熟字數」，顯示文字另外分支
interface ProgressBadge {
  attempts: number;
  bestFirstTry: number;
  total: number;
}
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brush,
  CheckCircle2,
  Landmark,
  Layers,
  Map as MapIcon,
  PenLine,
  ScrollText,
  SpellCheck2,
  Trophy,
} from "lucide-react";

const KIND_ICON: Record<ContentItem["kind"], React.ComponentType<{ className?: string }>> = {
  unit: BookOpen,
  wenyan: ScrollText,
  quiz: Trophy,
  hanzi: Brush,
  "homework-draft": PenLine,
  vocab: SpellCheck2,
  history: Landmark,
  prep: Layers,
};

export function SubjectView({
  subject,
  items,
}: {
  subject: Subject;
  items: ContentItem[];
}) {
  const [quizRecords, setQuizRecords] = React.useState<
    Record<string, ProgressBadge>
  >({});

  React.useEffect(() => {
    const map: Record<string, ProgressBadge> = {};
    for (const it of items) {
      const id = it.href.split("/").pop()!;
      if (it.kind === "quiz") {
        const r = getQuizRecord(id);
        if (r) map[id] = r;
      } else if (it.kind === "hanzi") {
        const pool = getHanziPoolLocal();
        const mastered = allHanziQuestions.filter((q) => pool[q.uid]?.m).length;
        if (mastered > 0)
          map[id] = {
            attempts: 0,
            bestFirstTry: mastered,
            total: allHanziQuestions.length,
          };
      }
    }
    setQuizRecords(map);
  }, [items]);

  // 章節地圖：每個 topicId 底下有哪些內容。點亮的章節點一下，在下方展開該章全部內容
  // （一章常有好幾頁：複習頁＋題組，直接跳到第一個會讓人以為連錯）。
  const topicItems = React.useMemo(() => {
    const m: Record<string, ContentItem[]> = {};
    for (const it of items) {
      if (!it.topicId) continue;
      (m[it.topicId] ??= []).push(it);
    }
    return m;
  }, [items]);
  const [topicSel, setTopicSel] = React.useState<string | null>(null);

  // 章節地圖分組：目前學期排最前，其餘照三年順序，「先修」放最後
  const semesters = React.useMemo(() => {
    const all = roadmap.map((r) => r.semester);
    const rest = all.filter((s) => s !== school.currentSemester);
    return [school.currentSemester, ...rest, "先修" as const];
  }, []);
  const active = items.filter((it) => !it.archived);
  const archived = items.filter((it) => it.archived);

  const renderItem = (it: ContentItem) => {
    const Icon = KIND_ICON[it.kind];
    const quizId =
      it.kind === "quiz" || it.kind === "hanzi" ? it.href.split("/").pop()! : null;
    const rec = quizId ? quizRecords[quizId] : undefined;
    return (
      <Link
        key={it.key}
        href={it.href}
        className="group block rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-start gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: subject.color.soft, color: subject.color.main }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: subject.color.soft, color: subject.color.main }}
              >
                {it.badge}
              </span>
              {rec && (
                <span className="flex items-center gap-1 rounded-full bg-correct/15 px-2 py-0.5 text-xs font-medium text-correct">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {it.kind === "hanzi" ? (
                    <>已精熟 {rec.bestFirstTry}/{rec.total} 字</>
                  ) : (
                    <>做過 {rec.attempts} 次・最佳一次就對 {rec.bestFirstTry}/{rec.total}</>
                  )}
                </span>
              )}
            </div>
            <h3 className="mt-1.5 font-bold tracking-tight">{it.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{it.subtitle}</p>
          </div>
          <ArrowRight
            className="mt-1 h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1"
            style={{ color: subject.color.main }}
          />
        </div>
      </Link>
    );
  };

  return (
    <div className="flex flex-1 flex-col py-8">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        回學習站首頁
      </Link>

      {/* 科目主色頭 */}
      <header
        className="relative overflow-hidden rounded-3xl p-7 text-white shadow-soft"
        style={{ background: subject.color.grad }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-2 top-2 text-7xl opacity-20"
        >
          {subject.emoji}
        </span>
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
            {subject.publisher}版・{gradeLabel(school.currentSemester)}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            {subject.emoji} {subject.name}基地
          </h1>
          <p className="mt-1.5 text-[15px] text-white/90">{subject.tagline}</p>
        </div>
      </header>

      {/* 學習內容清單 */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold tracking-tight">
          這學期的內容
          <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {active.length} 個
          </span>
        </h2>

        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 p-8 text-center text-muted-foreground">
            <p className="text-sm">
              這一科的學期內容正在準備中——
              <br />
              可以請媽媽用 Claude Code 做考前複習頁或出題加進來。
            </p>
          </div>
        ) : (
          <div className="space-y-3">{active.map(renderItem)}</div>
        )}
      </section>

      {archived.length > 0 && (
        <details className="mt-8 rounded-2xl border bg-card/60 p-4">
          <summary className="cursor-pointer text-sm font-bold text-muted-foreground">
            暑假先修內容（{archived.length}）— 點開查看
          </summary>
          <div className="mt-3 space-y-3">{archived.map(renderItem)}</div>
        </details>
      )}

      {/* 課本章節地圖 */}
      <section className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <MapIcon className="h-5 w-5" style={{ color: subject.color.main }} />
          <h2 className="text-lg font-bold tracking-tight">
            課本章節地圖（{subject.publisher}版）
          </h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          亮起來的章節＝這裡已經有內容可以練，點一下展開該章全部內容；灰色的＝之後會慢慢補上。
        </p>
        <div className="space-y-5">
          {semesters.map((sem) => {
            const topics = subject.topics.filter((t) => t.semester === sem);
            if (topics.length === 0) return null;
            return (
              <div key={sem}>
                <h3 className="mb-2 text-sm font-bold text-muted-foreground">
                  {sem === "先修" ? "先修・基礎能力" : `${sem}學期`}
                  {sem === school.currentSemester && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[11px] text-white">
                      現在
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {topics.map((t) => {
                    const list = topicItems[t.id];
                    if (list && list.length > 0) {
                      // 已涵蓋：點一下在下方展開該章內容（再點一下收起）
                      const on = topicSel === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTopicSel(on ? null : t.id)}
                          aria-expanded={on}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md",
                            on ? "border-foreground/40 ring-2 ring-foreground/15" : "border-transparent",
                          )}
                          style={{ background: subject.color.main }}
                        >
                          ✓ {t.title}
                          <span className="ml-1.5 rounded-full bg-white/25 px-1.5 text-[11px]">{list.length}</span>
                        </button>
                      );
                    }
                    // 未涵蓋：純顯示（灰色、不可點）
                    return (
                      <span
                        key={t.id}
                        className="cursor-default rounded-xl border border-dashed bg-card/40 px-3 py-2 text-sm text-muted-foreground"
                        title="這個章節之後會補上互動內容"
                      >
                        {t.title}
                      </span>
                    );
                  })}
                </div>
                {topicSel && topics.some((t) => t.id === topicSel) && (
                  <div className="mt-3 rounded-2xl border p-3" style={{ background: subject.color.soft }}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-bold">
                        {subject.topics.find((t) => t.id === topicSel)?.title}・{topicItems[topicSel].length} 個內容
                      </span>
                      <button
                        type="button"
                        onClick={() => setTopicSel(null)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        收起
                      </button>
                    </div>
                    <div className="space-y-2">{topicItems[topicSel].map(renderItem)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
