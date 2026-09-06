"use client";

// 考前複習頁引擎（五科共用）。
//
// 一頁 = 課本一個範圍：重點挖空 + 翻卡 + 比較表 + 題組入口。
// 原則：答案預設遮住，孩子先想再點開；每張卡可標「會了／再練」，
// 錯的依間隔（1→3→7→14→30 天）回鍋，連對 5 次視為掌握。

import * as React from "react";
import Link from "next/link";
import type { PrepSet, PrepCard, PrepSection } from "@/content/prep/types";
import { getSubject, getTopic } from "@/content/subjects";
import { getQuiz } from "@/content/quizzes";
import { getQuizRecord, type QuizRecord } from "@/lib/quiz-storage";
import {
  cardUid,
  clearPrep,
  markCard,
  savePrepPool,
  syncPrepPool,
  type PrepPoolState,
} from "@/lib/prep-storage";
import { cn } from "@/lib/utils";
import { DiagramGame } from "./diagram-game";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCcw,
  Shuffle,
  Trophy,
} from "lucide-react";

type Mode = "front" | "back"; // front = 看正面想背面（預設）

// ── 挖空：把「【答案】」切成可點的遮罩 ─────────────────────────
function splitCloze(text: string): { t: string; blank: boolean }[] {
  const out: { t: string; blank: boolean }[] = [];
  const re = /【(.+?)】/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index), blank: false });
    out.push({ t: m[1], blank: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last), blank: false });
  return out;
}

function Cloze({
  text,
  keyPrefix,
  revealed,
  onToggle,
  color,
}: {
  text: string;
  keyPrefix: string;
  revealed: Set<string>;
  onToggle: (k: string) => void;
  color: string;
}) {
  let i = 0;
  return (
    <>
      {splitCloze(text).map((p, idx) => {
        if (!p.blank) return <React.Fragment key={idx}>{p.t}</React.Fragment>;
        const k = `${keyPrefix}#${i++}`;
        const show = revealed.has(k);
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onToggle(k)}
            title={show ? "點一下遮回去" : "點一下顯示"}
            className={cn(
              "mx-0.5 inline-block min-w-[2.5em] rounded-md px-1.5 align-baseline font-bold leading-snug transition-colors",
              show ? "" : "select-none",
            )}
            style={
              show
                ? { background: `${color}1a`, color }
                : { background: color, color }
            }
          >
            {p.t}
          </button>
        );
      })}
    </>
  );
}

// ── 翻卡 ───────────────────────────────────────────────────────
function FlipCard({
  card,
  index,
  mode,
  status,
  open,
  onFlip,
  onMark,
  color,
  frontLabel,
  backLabel,
}: {
  card: PrepCard;
  index: number;
  mode: Mode;
  status?: "got" | "again" | "mastered";
  open: boolean;
  onFlip: () => void;
  onMark: (r: "got" | "again") => void;
  color: string;
  frontLabel: string;
  backLabel: string;
}) {
  const answer = (
    <p className="text-[24px] font-black leading-tight tracking-tight" style={{ color }}>
      {card.back}
      {card.note && (
        <span className="mt-1 block font-mono text-[11px] font-medium tracking-wider text-muted-foreground">
          {card.note}
        </span>
      )}
    </p>
  );
  const clue = <p className="text-[14.5px] leading-relaxed">{card.front}</p>;
  const got = status === "got" || status === "mastered";
  const faceCls =
    "absolute inset-0 flex flex-col overflow-auto rounded-2xl border bg-card p-4 shadow-sm transition-colors [backface-visibility:hidden]";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip();
        }
      }}
      className={cn("flip min-h-[176px] cursor-pointer", open && "open")}
    >
      <div className="flip-inner relative h-full min-h-[176px] w-full">
        <div
          className={cn(faceCls, got && "border-correct/60 bg-correct/10", status === "again" && "border-gentle/70")}
        >
          <div className="mb-2 font-mono text-[11px] font-bold tracking-widest text-muted-foreground">
            {String(index + 1).padStart(2, "0")} · {mode === "front" ? frontLabel : backLabel}
            {got && <span className="ml-2 text-correct">✓ 會了</span>}
            {status === "again" && <span className="ml-2 text-gentle-foreground">↻ 再練</span>}
          </div>
          <div className="flex-1">{mode === "front" ? clue : answer}</div>
          <div className="mt-2 font-mono text-[11px] tracking-wider text-muted-foreground">
            點一下看{mode === "front" ? backLabel : frontLabel}
          </div>
        </div>
        <div className={cn(faceCls, "flip-back", got && "border-correct/60 bg-correct/10")}>
          <div className="mb-2 font-mono text-[11px] font-bold tracking-widest text-muted-foreground">
            {String(index + 1).padStart(2, "0")} · {mode === "front" ? backLabel : frontLabel}
          </div>
          <div className="flex-1">
            {mode === "front" ? answer : clue}
            {mode === "front" && (
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{card.front}</p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMark("got");
              }}
              className="flex-1 rounded-lg border bg-secondary/60 px-2 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-correct hover:text-correct"
            >
              ✓ 會了
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMark("again");
              }}
              className="flex-1 rounded-lg border bg-secondary/60 px-2 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-gentle hover:text-gentle-foreground"
            >
              再練一次
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 主元件 ─────────────────────────────────────────────────────
export function PrepPlayer({ prep }: { prep: PrepSet }) {
  const subject = getSubject(prep.subjectId);
  const topic = prep.topicId ? getTopic(prep.topicId) : undefined;
  const color = subject?.color.main ?? "hsl(252 83% 62%)";
  const soft = subject?.color.soft ?? "hsl(252 83% 62% / 0.1)";

  const [pool, setPool] = React.useState<PrepPoolState>({});
  const [mode, setMode] = React.useState<Mode>("front");
  const [onlyLeft, setOnlyLeft] = React.useState(false);
  const [open, setOpen] = React.useState<Set<string>>(new Set());
  const [revealed, setRevealed] = React.useState<Set<string>>(new Set());
  const [order, setOrder] = React.useState<Record<number, string[]>>({});
  const [quizRecords, setQuizRecords] = React.useState<Record<string, QuizRecord | null>>({});

  React.useEffect(() => {
    syncPrepPool().then(setPool);
    const recs: Record<string, QuizRecord | null> = {};
    for (const s of prep.sections) if (s.kind === "quiz") recs[s.quizId] = getQuizRecord(s.quizId);
    setQuizRecords(recs);
  }, [prep]);

  // 所有卡片與所有挖空 key（給計數與「全部顯示」用）
  const allCards = React.useMemo(
    () => prep.sections.flatMap((s) => (s.kind === "flashcards" ? s.cards : [])),
    [prep],
  );
  const allBlankKeys = React.useMemo(() => {
    const keys: string[] = [];
    prep.sections.forEach((s, si) => {
      const push = (text: string, prefix: string) => {
        const n = splitCloze(text).filter((p) => p.blank).length;
        for (let i = 0; i < n; i++) keys.push(`${prefix}#${i}`);
      };
      if (s.kind === "keypoints") s.items.forEach((t, ii) => push(t, `${si}-${ii}`));
      if (s.kind === "compare")
        s.rows.forEach((r, ri) => {
          push(r.a, `${si}-${ri}-a`);
          push(r.b, `${si}-${ri}-b`);
        });
    });
    return keys;
  }, [prep]);

  const firstDeck = prep.sections.find(
    (s): s is Extract<PrepSection, { kind: "flashcards" }> => s.kind === "flashcards",
  );
  const labels = { front: firstDeck?.frontLabel ?? "正面", back: firstDeck?.backLabel ?? "背面" };

  const gotCount = allCards.filter((c) => {
    const e = pool[cardUid(prep.id, c.id)];
    return e && (e.s === "got" || e.s === "mastered");
  }).length;

  function statusOf(card: PrepCard) {
    return pool[cardUid(prep.id, card.id)]?.s;
  }
  function flip(uid: string) {
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(uid)) n.delete(uid);
      else n.add(uid);
      return n;
    });
  }
  function mark(card: PrepCard, r: "got" | "again") {
    const uid = cardUid(prep.id, card.id);
    const next = markCard(pool, uid, r);
    setPool(next);
    void savePrepPool(next);
    setOpen((s) => {
      const n = new Set(s);
      n.delete(uid);
      return n;
    });
  }
  function shuffle() {
    const next: Record<number, string[]> = {};
    prep.sections.forEach((s, si) => {
      if (s.kind !== "flashcards") return;
      const ids = s.cards.map((c) => c.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      next[si] = ids;
    });
    setOrder(next);
  }
  function toggleBlank(k: string) {
    setRevealed((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  }
  function resetAll() {
    if (!window.confirm("清除這一頁所有「會了／再練」紀錄？")) return;
    const next = clearPrep(pool, prep.id);
    setPool(next);
    void savePrepPool(next);
    setOnlyLeft(false);
  }

  const segBtn = (active: boolean) =>
    cn(
      "rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors",
      active ? "text-white" : "text-muted-foreground hover:text-foreground",
    );
  const toolBtn =
    "inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-sm font-bold transition-colors hover:border-primary/50";

  return (
    <div className="flex flex-1 flex-col py-8">
      <Link
        href={subject ? `/subject/${subject.id}` : "/"}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        回{subject?.name ?? ""}基地
      </Link>

      <header className="mb-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          {subject && (
            <span className="rounded-full px-2.5 py-0.5 font-bold" style={{ background: soft, color }}>
              {subject.name}・考前複習
            </span>
          )}
          {topic && <span className="text-muted-foreground">{topic.title}</span>}
        </div>
        <h1 className="text-3xl font-black tracking-tight">{prep.title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{prep.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {allCards.length > 0 && (
            <span className="font-mono">
              會了 <b className="text-base text-correct">{gotCount}</b> / {allCards.length} 張
            </span>
          )}
          {prep.source && <span>來源：{prep.source}</span>}
        </div>
      </header>

      {/* 工具列 */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b bg-background/85 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
        {allCards.length > 0 && (
          <>
            <div className="inline-flex rounded-full border bg-secondary/60 p-0.5">
              <button
                type="button"
                className={segBtn(mode === "front")}
                style={mode === "front" ? { background: color } : undefined}
                onClick={() => {
                  setMode("front");
                  setOpen(new Set());
                }}
              >
                看{labels.front}想{labels.back}
              </button>
              <button
                type="button"
                className={segBtn(mode === "back")}
                style={mode === "back" ? { background: color } : undefined}
                onClick={() => {
                  setMode("back");
                  setOpen(new Set());
                }}
              >
                看{labels.back}想{labels.front}
              </button>
            </div>
            <button type="button" className={toolBtn} onClick={shuffle}>
              <Shuffle className="h-3.5 w-3.5" /> 洗牌
            </button>
            <button
              type="button"
              className={cn(toolBtn, onlyLeft && "border-primary/60 bg-primary/10 text-primary")}
              onClick={() => setOnlyLeft((v) => !v)}
              aria-pressed={onlyLeft}
            >
              只練沒會的
            </button>
            <button type="button" className={toolBtn} onClick={() => setOpen(new Set())}>
              全部蓋回
            </button>
          </>
        )}
        {allBlankKeys.length > 0 && (
          <button
            type="button"
            className={toolBtn}
            onClick={() =>
              setRevealed(revealed.size === allBlankKeys.length ? new Set() : new Set(allBlankKeys))
            }
          >
            {revealed.size === allBlankKeys.length ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> 挖空全遮
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> 挖空全開
              </>
            )}
          </button>
        )}
        <span className="flex-1" />
        {allCards.length > 0 && (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            onClick={resetAll}
          >
            <RotateCcw className="h-3.5 w-3.5" /> 清除紀錄
          </button>
        )}
      </div>

      {/* 內容區 */}
      <div className="space-y-10">
        {prep.sections.map((s, si) => {
          if (s.kind === "flashcards") {
            const ids = order[si] ?? s.cards.map((c) => c.id);
            const cards = ids.map((id) => s.cards.find((c) => c.id === id)!).filter(Boolean);
            return (
              <section key={si}>
                <SectionHead title={s.title} intro={s.intro} color={color} soft={soft} chip={`${s.cards.length} 張`} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cards.map((c, i) => {
                    const st = statusOf(c);
                    if (onlyLeft && (st === "got" || st === "mastered")) return null;
                    const uid = cardUid(prep.id, c.id);
                    return (
                      <FlipCard
                        key={c.id}
                        card={c}
                        index={i}
                        mode={mode}
                        status={st}
                        open={open.has(uid)}
                        onFlip={() => flip(uid)}
                        onMark={(r) => mark(c, r)}
                        color={color}
                        frontLabel={s.frontLabel}
                        backLabel={s.backLabel}
                      />
                    );
                  })}
                </div>
              </section>
            );
          }
          if (s.kind === "keypoints") {
            return (
              <section key={si}>
                <SectionHead title={s.title} intro={s.intro} color={color} soft={soft} />
                <ol className="space-y-2.5 rounded-2xl border bg-card p-5 shadow-sm">
                  {s.items.map((t, ii) => (
                    <li key={ii} className="flex gap-3 text-[15px] leading-relaxed">
                      <span className="mt-0.5 font-mono text-xs font-bold" style={{ color }}>
                        {String(ii + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <Cloze text={t} keyPrefix={`${si}-${ii}`} revealed={revealed} onToggle={toggleBlank} color={color} />
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            );
          }
          if (s.kind === "compare") {
            return (
              <section key={si}>
                <SectionHead title={s.title} intro={s.intro} color={color} soft={soft} />
                <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
                  <table className="w-full min-w-[520px] text-[14.5px]">
                    <thead>
                      <tr className="border-b text-left font-mono text-xs tracking-wider text-muted-foreground">
                        <th className="p-3 font-bold"></th>
                        <th className="p-3 font-bold" style={{ color }}>{s.columns[0]}</th>
                        <th className="p-3 font-bold">{s.columns[1]}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.rows.map((r, ri) => (
                        <tr key={ri} className="border-b last:border-0 align-top">
                          <th className="p-3 text-left font-bold text-muted-foreground">{r.label}</th>
                          <td className="p-3 leading-relaxed">
                            <Cloze text={r.a} keyPrefix={`${si}-${ri}-a`} revealed={revealed} onToggle={toggleBlank} color={color} />
                          </td>
                          <td className="p-3 leading-relaxed">
                            <Cloze text={r.b} keyPrefix={`${si}-${ri}-b`} revealed={revealed} onToggle={toggleBlank} color={color} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          }
          if (s.kind === "diagram") {
            return (
              <section key={si}>
                <SectionHead title={s.title} intro={s.intro} color={color} soft={soft} chip={`${s.hotspots.length} 個部位`} />
                <DiagramGame
                  figure={s.figure}
                  hotspots={s.hotspots}
                  color={color}
                  soft={soft}
                  storageKey={`gz-prep:diagram:${prep.id}:${si}`}
                />
              </section>
            );
          }
          // quiz
          const quiz = getQuiz(s.quizId);
          const rec = quizRecords[s.quizId];
          return (
            <section key={si}>
              <SectionHead title={s.title ?? "做題驗收"} color={color} soft={soft} />
              {quiz ? (
                <Link
                  href={`/quiz/${quiz.id}`}
                  className="group flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: soft, color }}>
                    <Trophy className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{quiz.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {quiz.questions.length} 題
                      {rec && (
                        <span className="ml-2 inline-flex items-center gap-1 text-correct">
                          <CheckCircle2 className="h-3.5 w-3.5" /> 最佳一次就對 {rec.bestFirstTry}/{rec.total}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color }} />
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">找不到題組 {s.quizId}。</p>
              )}
            </section>
          );
        })}
      </div>

      <footer className="mt-12 border-t pt-5 text-sm text-muted-foreground">
        翻開之後先講一次「為什麼」，再按會了。紀錄會跨裝置同步（有連 Supabase 時）。
      </footer>
    </div>
  );
}

function SectionHead({
  title,
  intro,
  color,
  soft,
  chip,
}: {
  title: string;
  intro?: string;
  color: string;
  soft: string;
  chip?: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-xl font-black tracking-tight">{title}</h2>
        {chip && (
          <span className="rounded-full px-2.5 py-0.5 font-mono text-xs font-bold" style={{ background: soft, color }}>
            {chip}
          </span>
        )}
      </div>
      {intro && <p className="mt-1 text-sm text-muted-foreground">{intro}</p>}
    </div>
  );
}
