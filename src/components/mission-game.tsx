"use client";

// 數線闖關（複習頁的 mission 區塊）。
//   一關一個概念，照順序解鎖。每題先自己作答：點數線（place）、選答案（choice）、
//   或先預測終點再看小點一步一步走（walk）。對錯都會看到「為什麼」。
//   答錯的題排到這一關最後回鍋，全部答對才過關；成績記「一次就對 X / N」，存本機。

import * as React from "react";
import type { MissionChallenge, MissionLevel } from "@/content/prep/types";
import { generateMission, sup } from "@/lib/mission-gen";
import { touchStreak } from "@/lib/streak";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Flame, Lightbulb, Lock, Minus, Play, Plus, RotateCcw } from "lucide-react";

export interface MissionRecord {
  best: number; // 最佳「一次就對」題數
  total: number;
  plays: number;
  missed: string[]; // 最近一次卡住的概念
  bestSec?: number; // 全部一次就對時的最快秒數（熟練場用）
}
export type MissionRecords = Record<string, MissionRecord>;

export function readMissionRecords(storageKey: string): MissionRecords {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as MissionRecords) : {};
  } catch {
    return {};
  }
}

const fmt = (v: number) => (v > 0 ? `${v}` : `${v}`);
const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((v) => b.includes(v));
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// a×10ⁿ 展開成一般寫法（用字串搬小數點，避免浮點誤差）："4.5", 6 → "4,500,000"
export function expandSci(m: string, exp: number): string {
  if (!/^\d+(\.\d+)?$/.test(m)) return "";
  const [int, frac = ""] = m.split(".");
  let digits = int + frac;
  let point = int.length + exp; // 小數點在 digits 的第幾位之後
  if (point <= 0) {
    digits = "0".repeat(1 - point) + digits;
    point = 1;
  } else if (point > digits.length) {
    digits = digits + "0".repeat(point - digits.length);
  }
  const ip = digits.slice(0, point).replace(/^0+(?=\d)/, "");
  const fp = digits.slice(point).replace(/0+$/, "");
  return ip.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fp ? `.${fp}` : "");
}

// ── 數線 ───────────────────────────────────────────────────────
const W = 720;
const H = 120;
const PAD = 30;
const AXIS_Y = 74;

function Line({
  min,
  max,
  color,
  picks,
  onPick,
  locked,
  answers,
  walk,
}: {
  min: number;
  max: number;
  color: string;
  picks: number[];
  onPick: (v: number) => void;
  locked: boolean; // 已作答：不能再點，並標出正解
  answers: number[];
  walk?: { start: number; moves: number[]; step: number }; // step = 已走幾步
}) {
  const stepPx = (W - PAD * 2) / (max - min);
  const x = (v: number) => PAD + (v - min) * stepPx;
  const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const pos = walk ? walk.start + walk.moves.slice(0, walk.step).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="overflow-x-auto rounded-xl border bg-secondary/40 px-1 py-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px] select-none" role="img" aria-label="數線">
        <line x1={PAD - 18} y1={AXIS_Y} x2={W - PAD + 18} y2={AXIS_Y} stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
        <polygon points={`${W - PAD + 22},${AXIS_Y} ${W - PAD + 12},${AXIS_Y - 5} ${W - PAD + 12},${AXIS_Y + 5}`} fill="hsl(var(--muted-foreground))" />
        <polygon points={`${PAD - 22},${AXIS_Y} ${PAD - 12},${AXIS_Y - 5} ${PAD - 12},${AXIS_Y + 5}`} fill="hsl(var(--muted-foreground))" />

        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={x(v)}
              y1={AXIS_Y - (v === 0 ? 11 : 6)}
              x2={x(v)}
              y2={AXIS_Y + (v === 0 ? 11 : 6)}
              stroke={v === 0 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
              strokeWidth={v === 0 ? 2.5 : 1.5}
            />
            <text x={x(v)} y={AXIS_Y + 28} textAnchor="middle" className="fill-muted-foreground text-[12px]" style={{ fontWeight: v === 0 ? 800 : 500 }}>
              {fmt(v)}
            </text>
          </g>
        ))}

        {/* 走過的每一步 */}
        {walk &&
          walk.moves.slice(0, walk.step).map((d, i) => {
            const from = walk.start + walk.moves.slice(0, i).reduce((a, b) => a + b, 0);
            const mid = (x(from) + x(from + d)) / 2;
            const top = AXIS_Y - 40 - (i % 2) * 10;
            const c = d > 0 ? color : "hsl(var(--gentle))";
            return (
              <g key={i}>
                <path d={`M ${x(from)} ${AXIS_Y - 8} Q ${mid} ${top} ${x(from + d)} ${AXIS_Y - 8}`} fill="none" stroke={c} strokeWidth={2.5} />
                <text x={mid} y={top + 4} textAnchor="middle" className="text-[12px]" fill={c} style={{ fontWeight: 800 }}>
                  {d > 0 ? `往右 ${d}` : `往左 ${-d}`}
                </text>
              </g>
            );
          })}

        {/* 出發點 */}
        {walk && (
          <g>
            <circle cx={x(walk.start)} cy={AXIS_Y} r={9} fill="hsl(var(--card))" stroke={color} strokeWidth={2.5} />
            <text x={x(walk.start)} y={AXIS_Y + 46} textAnchor="middle" className="text-[11px]" fill={color} style={{ fontWeight: 800 }}>
              出發
            </text>
          </g>
        )}

        {/* 作答後：正解 */}
        {locked && answers.map((v) => <circle key={`a${v}`} cx={x(v)} cy={AXIS_Y} r={10} fill="hsl(var(--correct))" />)}

        {/* 選的點＋可點區 */}
        {ticks.map((v) => {
          const sel = picks.includes(v);
          const wrong = locked && sel && !answers.includes(v);
          return (
            <circle
              key={`h${v}`}
              cx={x(v)}
              cy={AXIS_Y}
              r={sel && !locked ? 10 : wrong ? 8 : 14}
              fill={sel && !locked ? color : wrong ? "hsl(var(--gentle))" : "transparent"}
              onClick={() => !locked && onPick(v)}
              className={locked ? undefined : "cursor-pointer"}
            />
          );
        })}

        {/* 正在走的小點 */}
        {walk && walk.step > 0 && (
          <circle cx={x(pos)} cy={AXIS_Y} r={7} fill={color} stroke="hsl(var(--card))" strokeWidth={2} style={{ transition: "cx 0.45s ease" }} />
        )}
      </svg>
    </div>
  );
}

// ── 主元件 ─────────────────────────────────────────────────────
export function MissionGame({
  levels,
  line,
  color,
  soft,
  storageKey,
}: {
  levels: MissionLevel[];
  line: { min: number; max: number };
  color: string;
  soft: string;
  storageKey: string;
}) {
  const [records, setRecords] = React.useState<MissionRecords>({});
  const [levelId, setLevelId] = React.useState<string | null>(null);
  const [all, setAll] = React.useState<MissionChallenge[]>([]); // 這一輪的全部題目（熟練場每次重出）
  const [queue, setQueue] = React.useState<MissionChallenge[]>([]);
  const [typed, setTyped] = React.useState("");
  const startedAt = React.useRef(0);
  const [lastSec, setLastSec] = React.useState(0);
  const [missed, setMissed] = React.useState<Set<string>>(new Set());
  const [picks, setPicks] = React.useState<number[]>([]);
  const [choice, setChoice] = React.useState<number | null>(null);
  const [phase, setPhase] = React.useState<"answer" | "walking" | "feedback" | "done">("answer");
  const [walkStep, setWalkStep] = React.useState(0);
  const [correct, setCorrect] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const [combo, setCombo] = React.useState(0); // 這一關目前連對幾題
  // match／order：本題的互動狀態
  const [rightOrder, setRightOrder] = React.useState<number[]>([]); // 右欄／待選的打亂順序（索引）
  const [selLeft, setSelLeft] = React.useState<number | null>(null);
  const [doneIdx, setDoneIdx] = React.useState<number[]>([]); // 已配對的左索引／已排好的項目索引
  const [slips, setSlips] = React.useState(0); // 本題點錯次數
  const [shake, setShake] = React.useState<number | null>(null);
  const [exp, setExp] = React.useState(0); // sci：指數

  React.useEffect(() => setRecords(readMissionRecords(storageKey)), [storageKey]);

  const level = levels.find((l) => l.id === levelId) ?? null;
  const cur = queue[0];

  // walk：作答後一步一步走，走完才給回饋
  React.useEffect(() => {
    if (phase !== "walking" || !cur || cur.type !== "walk") return;
    if (walkStep >= cur.moves.length) {
      const t = window.setTimeout(() => setPhase("feedback"), 500);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setWalkStep((s) => s + 1), 750);
    return () => window.clearTimeout(t);
  }, [phase, walkStep, cur]);

  function resetTurn(c?: MissionChallenge) {
    setPicks([]);
    setTyped("");
    setChoice(null);
    setWalkStep(0);
    setSelLeft(null);
    setDoneIdx([]);
    setSlips(0);
    setShake(null);
    setExp(0);
    const n = c?.type === "match" ? c.pairs.length : c?.type === "order" ? c.items.length : 0;
    setRightOrder(n ? shuffled(Array.from({ length: n }, (_, i) => i)) : []);
    setPhase("answer");
  }

  function startLevel(l: MissionLevel) {
    const list = l.generator ? generateMission(l.generator.kind, l.generator.count) : l.challenges;
    setLevelId(l.id);
    setAll(list);
    setQueue(list);
    startedAt.current = Date.now();
    setMissed(new Set());
    setShowHint(false);
    setCombo(0);
    resetTurn(list[0]);
  }

  function answersOf(c: MissionChallenge): number[] {
    if (c.type === "place") return c.targets;
    if (c.type === "walk") return [c.start + c.moves.reduce((a, b) => a + b, 0)];
    return [];
  }

  function submit(choiceIndex?: number) {
    if (!cur || phase !== "answer") return;
    let ok: boolean;
    switch (cur.type) {
      case "choice":
        ok = choiceIndex === cur.answerIndex;
        setChoice(choiceIndex ?? null);
        break;
      case "spot":
        ok = choiceIndex === cur.wrongIndex;
        setChoice(choiceIndex ?? null);
        break;
      case "input":
        ok = Number(typed) === cur.answer;
        break;
      case "sci":
        ok = Number(typed) === cur.mantissa && exp === cur.exponent;
        break;
      case "match":
      case "order":
        ok = slips === 0; // 全部完成才會叫 submit；有點錯過就不算一次就對
        break;
      default:
        ok = sameSet(picks, answersOf(cur));
    }
    setCorrect(ok);
    setCombo((c) => (ok ? c + 1 : 0));
    if (!ok) setMissed((s) => new Set(s).add(cur.id));
    setPhase(cur.type === "walk" ? "walking" : "feedback");
  }
  // submit 用 ref 包起來，讓 setTimeout 裡叫到的是最新的狀態
  const submitRef = React.useRef(submit);
  submitRef.current = submit;

  // match：點左欄再點右欄
  function tapLeft(i: number) {
    if (phase !== "answer" || doneIdx.includes(i)) return;
    setSelLeft((s) => (s === i ? null : i));
  }
  function tapRight(i: number) {
    if (phase !== "answer" || cur?.type !== "match" || selLeft === null || doneIdx.includes(i)) return;
    if (i === selLeft) {
      const d = [...doneIdx, i];
      setDoneIdx(d);
      setSelLeft(null);
      if (d.length === cur.pairs.length) window.setTimeout(() => submitRef.current(), 250);
    } else {
      setSlips((n) => n + 1);
      setShake(i);
      window.setTimeout(() => setShake((x) => (x === i ? null : x)), 500);
    }
  }
  // order：由小到大點
  function tapOrder(i: number) {
    if (phase !== "answer" || cur?.type !== "order" || doneIdx.includes(i)) return;
    const remaining = cur.items.map((it, k) => ({ k, v: it.value })).filter((x) => !doneIdx.includes(x.k));
    const smallest = remaining.reduce((a, b) => (b.v < a.v ? b : a));
    if (smallest.k === i) {
      const d = [...doneIdx, i];
      setDoneIdx(d);
      if (d.length === cur.items.length) window.setTimeout(() => submitRef.current(), 250);
    } else {
      setSlips((n) => n + 1);
      setShake(i);
      window.setTimeout(() => setShake((x) => (x === i ? null : x)), 500);
    }
  }

  function next() {
    if (!cur || !level) return;
    const rest = correct ? queue.slice(1) : [...queue.slice(1), cur];
    setQueue(rest);
    if (rest.length > 0) return resetTurn(rest[0]);
    // 過關：存紀錄
    const total = all.length;
    const firstTry = total - missed.size;
    const prev = records[level.id];
    const sec = Math.round((Date.now() - startedAt.current) / 1000);
    setLastSec(sec);
    const rec: MissionRecord = {
      best: Math.max(prev?.best ?? 0, firstTry),
      total,
      plays: (prev?.plays ?? 0) + 1,
      missed: [...new Set(all.filter((c) => missed.has(c.id)).map((c) => c.concept))],
      bestSec: firstTry === total ? Math.min(prev?.bestSec ?? Infinity, sec) : prev?.bestSec,
    };
    const nextRecords = { ...records, [level.id]: rec };
    setRecords(nextRecords);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextRecords));
    } catch {
      /* 存不進去也別讓孩子卡住 */
    }
    touchStreak();
    setPhase("done");
  }

  function pick(v: number) {
    if (!cur) return;
    const multi = cur.type === "place" && cur.targets.length > 1;
    setPicks((p) => (multi ? (p.includes(v) ? p.filter((n) => n !== v) : [...p, v]) : [v]));
  }

  function press(k: string) {
    if (phase !== "answer") return;
    setTyped((t) => {
      if (k === "⌫") return t.slice(0, -1);
      if (k === "-") return t.startsWith("-") ? t.slice(1) : `-${t}`;
      if (k === ".") return t.includes(".") || t === "" ? t : t + k;
      return t.replace(/[-.]/g, "").length >= 3 ? t : t + k;
    });
  }

  // 電腦鍵盤也能打答案
  const isSci = cur?.type === "sci";
  const canType = (cur?.type === "input" || isSci) && phase === "answer";
  const typedOk = /\d/.test(typed) && !typed.endsWith(".");
  React.useEffect(() => {
    if (!canType) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key) || (e.key === "-" && !isSci) || (e.key === "." && isSci)) press(e.key);
      else if (e.key === "Backspace") press("⌫");
      else if (e.key === "Enter" && typedOk) submit();
      else if (isSci && e.key === "ArrowUp") setExp((x) => Math.min(12, x + 1));
      else if (isSci && e.key === "ArrowDown") setExp((x) => Math.max(-9, x - 1));
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const pill = "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-40";

  // ── 關卡地圖 ──
  if (!level) {
    return (
      <ol className="grid gap-2.5 sm:grid-cols-2">
        {levels.map((l, i) => {
          const rec = records[l.id];
          const unlocked = i === 0 || Boolean(records[levels[i - 1].id]);
          const perfect = rec && rec.best === rec.total;
          return (
            <li key={l.id}>
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => startLevel(l)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm transition-all",
                  unlocked ? "hover:-translate-y-0.5 hover:shadow-md" : "opacity-55",
                )}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-base font-black"
                  style={rec ? { background: color, color: "white" } : { background: soft, color }}
                >
                  {!unlocked ? <Lock className="h-4 w-4" /> : perfect ? <Check className="h-5 w-5" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{l.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{l.goal}</span>
                  <span className="mt-1.5 block font-mono text-xs text-muted-foreground">
                    {rec ? (
                      <>
                        最佳一次就對 <b style={{ color }}>{rec.best}</b> / {rec.total}
                        {rec.bestSec != null && `・最快 ${rec.bestSec} 秒`}
                        {!perfect && "・再玩一次挑戰全對"}
                      </>
                    ) : unlocked ? (
                      l.generator ? `熟練場・每次隨機 ${l.generator.count} 題` : `${l.challenges.length} 題`
                    ) : (
                      "先過前一關"
                    )}
                  </span>
                </span>
                {unlocked && <Play className="mt-1 h-4 w-4 shrink-0" style={{ color }} />}
              </button>
            </li>
          );
        })}
      </ol>
    );
  }

  const levelIndex = levels.findIndex((l) => l.id === level.id);
  const nextLevel = levels[levelIndex + 1];

  // ── 過關畫面 ──
  if (phase === "done") {
    const rec = records[level.id];
    const total = all.length;
    const firstTry = total - missed.size;
    return (
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="text-sm font-bold text-muted-foreground">
          第 {levelIndex + 1} 關・{level.title}
        </div>
        <div className="mt-1 text-xl font-black">{firstTry === total ? "全部一次就對，這關的概念站穩了。" : "過關！"}</div>
        <div className="mt-2 text-3xl font-black tabular-nums" style={{ color }}>
          {firstTry} / {total}
          <span className="ml-1.5 text-xs font-bold text-muted-foreground">一次就對</span>
          {level.generator && (
            <span className="ml-4 text-base text-muted-foreground">
              {lastSec} 秒{rec?.bestSec != null && `（全對最快 ${rec.bestSec} 秒）`}
            </span>
          )}
        </div>
        {level.generator && firstTry === total && (
          <p className="mt-2 text-sm text-muted-foreground">題目每次都不一樣。先求全對，再求快——連續三次全對就算熟了。</p>
        )}
        {rec && rec.missed.length > 0 && (
          <div className="mt-3 rounded-xl p-3 text-sm leading-relaxed" style={{ background: soft }}>
            <div className="font-bold">這幾個概念還沒完全遷移，明天再玩一次這關：</div>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              {rec.missed.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {nextLevel && (
            <button type="button" className={pill} style={{ background: color }} onClick={() => startLevel(nextLevel)}>
              下一關：{nextLevel.title} <ArrowRight className="h-4 w-4" />
            </button>
          )}
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-bold" onClick={() => startLevel(level)}>
            <RotateCcw className="h-3.5 w-3.5" /> 再玩一次
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-bold" onClick={() => setLevelId(null)}>
            回關卡地圖
          </button>
        </div>
      </div>
    );
  }

  if (!cur) return null;
  const locked = phase !== "answer";
  const total = all.length;
  const multi = cur.type === "place" && cur.targets.length > 1;

  // ── 作答畫面 ──
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <button type="button" onClick={() => setLevelId(null)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> 關卡地圖
        </button>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: soft, color }}>
          第 {levelIndex + 1} 關・{level.title}
        </span>
        {combo >= 2 && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-bold text-white" style={{ background: color }}>
            <Flame className="h-3 w-3" /> 連對 {combo}
          </span>
        )}
        <span className="flex-1" />
        <span className="font-mono text-xs text-muted-foreground">
          還剩 {queue.length} 題・一次就對 {total - queue.length - [...missed].filter((id) => !queue.some((q) => q.id === id)).length}
        </span>
      </div>
      {/* 進度條：答對一題前進一格 */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full transition-all" style={{ width: `${((total - queue.length) / total) * 100}%`, background: color }} />
      </div>

      {missed.has(cur.id) && phase === "answer" && (
        <div className="mb-2 text-xs font-bold text-gentle-foreground">↻ 這題剛剛沒對，再想一次</div>
      )}
      <p className="whitespace-pre-line text-[17px] font-bold leading-relaxed">{cur.prompt}</p>
      {(cur.type === "walk" || cur.type === "input") && cur.expr && (
        <div className="mt-2 font-mono text-2xl font-black tracking-wide" style={{ color }}>
          {cur.expr} = {cur.type === "input" ? <span className="rounded-lg border-2 px-3 py-0.5" style={{ borderColor: color }}>{typed || "？"}</span> : "？"}
        </div>
      )}
      {cur.type === "input" && !cur.expr && (
        <div className="mt-2 font-mono text-2xl font-black" style={{ color }}>
          答：<span className="rounded-lg border-2 px-3 py-0.5" style={{ borderColor: color }}>{typed || "？"}</span>
        </div>
      )}

      {cur.type === "sci" && (
        <div className="mt-2 rounded-xl border p-3" style={{ background: soft }}>
          <div className="font-mono text-2xl font-black" style={{ color }}>
            {cur.number} ={" "}
            <span className="rounded-lg border-2 bg-card px-3 py-0.5" style={{ borderColor: color }}>{typed || "？"}</span> × 10
            <sup className="rounded-md border-2 bg-card px-1.5 text-base" style={{ borderColor: color }}>{exp}</sup>
          </div>
          {phase === "answer" && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">指數 n：</span>
              <button type="button" onClick={() => setExp((x) => Math.max(-9, x - 1))} className="rounded-full border bg-card p-1.5 hover:border-primary/50" aria-label="指數減 1">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-mono text-lg font-black">{exp}</span>
              <button type="button" onClick={() => setExp((x) => Math.min(12, x + 1))} className="rounded-full border bg-card p-1.5 hover:border-primary/50" aria-label="指數加 1">
                <Plus className="h-4 w-4" />
              </button>
              <span className="ml-2 font-mono text-muted-foreground">
                現在拼出來是：<b className="text-foreground">{typedOk ? expandSci(typed, exp) : "—"}</b>
              </span>
            </div>
          )}
        </div>
      )}

      {(cur.type === "input" || cur.type === "sci") && phase === "answer" && (
        <div className="mt-3 grid max-w-[280px] grid-cols-3 gap-1.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", cur.type === "sci" ? "." : "-", "0", "⌫"].map((k) => (
            <button key={k} type="button" onClick={() => press(k)} className="rounded-xl border bg-card py-3 font-mono text-xl font-bold transition-colors hover:border-primary/50 active:bg-secondary">
              {k === "-" ? "+/−" : k}
            </button>
          ))}
          <button type="button" className={cn(pill, "col-span-3 justify-center py-3")} style={{ background: color }} disabled={!typedOk} onClick={() => submit()}>
            確定
          </button>
        </div>
      )}

      {cur.type === "match" && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
          <div className="grid gap-1.5">
            {cur.pairs.map((p, i) => {
              const done = doneIdx.includes(i);
              return (
                <button key={i} type="button" disabled={done || locked} onClick={() => tapLeft(i)}
                  className={cn("rounded-xl border px-3 py-3 text-center font-mono text-lg font-bold transition-colors", done ? "border-correct bg-correct/10 text-correct" : selLeft === i ? "text-white" : "bg-card hover:border-primary/50")}
                  style={selLeft === i && !done ? { background: color, borderColor: color } : undefined}>
                  {p.left}
                </button>
              );
            })}
          </div>
          <div className="grid gap-1.5">
            {rightOrder.map((i) => {
              const done = doneIdx.includes(i);
              return (
                <button key={i} type="button" disabled={done || locked} onClick={() => tapRight(i)}
                  className={cn("rounded-xl border px-3 py-3 text-center font-mono text-lg font-bold transition-colors", done ? "border-correct bg-correct/10 text-correct" : "bg-card hover:border-primary/50", shake === i && "animate-pop border-gentle bg-gentle/15 text-gentle-foreground")}>
                  {cur.pairs[i].right}
                </button>
              );
            })}
          </div>
          {phase === "answer" && (
            <div className="col-span-2 text-sm text-muted-foreground">
              {selLeft === null ? "先點左邊一個，再點右邊和它相等的。" : "現在點右邊和它相等的那個。"}
              {slips > 0 && <span className="ml-2 text-gentle-foreground">點錯 {slips} 次</span>}
            </div>
          )}
        </div>
      )}

      {cur.type === "order" && (
        <div className="mt-3">
          <div className="mb-1.5 font-mono text-[11px] font-bold tracking-widest text-muted-foreground">由小到大（點下一個最小的）</div>
          <div className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-xl p-2" style={{ background: soft }}>
            {doneIdx.map((i, k) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-2 font-mono text-lg font-bold shadow-sm">
                <span className="text-xs" style={{ color }}>{k + 1}</span>
                {cur.items[i].label}
              </span>
            ))}
            {doneIdx.length === 0 && <span className="px-1 text-sm text-muted-foreground">從下面點出最小的那個</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {rightOrder.filter((i) => !doneIdx.includes(i)).map((i) => (
              <button key={i} type="button" disabled={locked} onClick={() => tapOrder(i)}
                className={cn("rounded-xl border bg-card px-4 py-3 font-mono text-lg font-bold transition-colors hover:border-primary/50", shake === i && "animate-pop border-gentle bg-gentle/15 text-gentle-foreground")}>
                {cur.items[i].label}
              </button>
            ))}
          </div>
          {phase === "answer" && slips > 0 && <div className="mt-2 text-sm text-gentle-foreground">點錯 {slips} 次——先在心裡算出每個的值再點。</div>}
        </div>
      )}

      {cur.type === "spot" && (
        <ol className="mt-3 space-y-1.5">
          {cur.steps.map((st, i) => {
            const isAns = locked && i === cur.wrongIndex;
            const isWrong = locked && i === choice && i !== cur.wrongIndex;
            return (
              <li key={i}>
                <button type="button" disabled={locked} onClick={() => submit(i)}
                  className={cn("flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left font-mono text-[16px] font-bold transition-colors", !locked && "hover:border-primary/50", isAns && "border-correct bg-correct/10 text-correct", isWrong && "border-gentle bg-gentle/15 text-gentle-foreground")}>
                  <span className="text-xs text-muted-foreground">第 {i + 1} 步</span>
                  {st}
                </button>
              </li>
            );
          })}
          {phase === "answer" && <li className="text-sm text-muted-foreground">哪一步算錯了？點它。</li>}
        </ol>
      )}

      {(cur.type === "place" || cur.type === "walk") && (
        <div className="mt-3">
          <Line
            min={line.min}
            max={line.max}
            color={color}
            picks={picks}
            onPick={pick}
            locked={locked}
            answers={phase === "feedback" ? answersOf(cur) : []}
            walk={cur.type === "walk" ? { start: cur.start, moves: cur.moves, step: walkStep } : undefined}
          />
          {phase === "answer" && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" className={pill} style={{ background: color }} disabled={picks.length === 0} onClick={() => submit()}>
                {cur.type === "walk" ? "確定，走走看" : "確定"}
              </button>
              <span className="text-sm text-muted-foreground">
                {cur.type === "walk" ? "先預測：走完會停在哪？點數線上的位置。" : multi ? "符合的點不只一個，全部點出來（再點一次可取消）。" : "點數線上的位置。"}
              </span>
            </div>
          )}
          {phase === "walking" && <div className="mt-3 text-sm font-bold text-muted-foreground">走走看……</div>}
        </div>
      )}

      {cur.type === "choice" && (
        <div className={cn("mt-3 grid gap-2", cur.layout === "cards" ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-2")}>
          {cur.choices.map((c, i) => {
            const isAns = locked && i === cur.answerIndex;
            const isWrong = locked && i === choice && i !== cur.answerIndex;
            return (
              <button
                key={i}
                type="button"
                disabled={locked}
                onClick={() => submit(i)}
                className={cn(
                  "rounded-xl border bg-card px-4 text-left font-bold transition-colors",
                  cur.layout === "cards" ? "py-6 text-center font-mono text-2xl" : "py-3 text-[15px]",
                  !locked && "hover:border-primary/50",
                  isAns && "border-correct bg-correct/10 text-correct",
                  isWrong && "border-gentle bg-gentle/15 text-gentle-foreground",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

      {phase === "answer" && level.hint && (
        <div className="mt-4">
          {showHint ? (
            <div className="rounded-xl p-3 text-sm leading-relaxed" style={{ background: soft }}>
              <span className="font-bold" style={{ color }}>
                關鍵想法：
              </span>
              {level.hint}
            </div>
          ) : (
            <button type="button" onClick={() => setShowHint(true)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <Lightbulb className="h-4 w-4" /> 卡住了？看這關的關鍵想法
            </button>
          )}
        </div>
      )}

      {phase === "feedback" && (
        <div className={cn("mt-4 rounded-xl border p-4", correct ? "border-correct/50 bg-correct/10" : "border-gentle/60 bg-gentle/10")}>
          <div className={cn("font-black", correct ? "text-correct" : "text-gentle-foreground")}>
            {correct
              ? "對了！"
              : `還沒對${
                  cur.type === "input"
                    ? `——答案是 ${cur.answer}`
                    : cur.type === "sci"
                      ? `——應該是 ${cur.mantissa} × 10${sup(cur.exponent)}`
                      : cur.type === "match" || cur.type === "order"
                        ? `——中間點錯了 ${slips} 次`
                        : cur.type === "spot"
                          ? `——錯的是第 ${cur.wrongIndex + 1} 步`
                          : cur.type === "choice"
                            ? ""
                            : `——正確位置是 ${answersOf(cur).map(fmt).join("、")}（綠點）`
                }。這題等一下會再來一次。`}
          </div>
          <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed">{cur.why}</p>
          <button type="button" className={cn(pill, "mt-3")} style={{ background: color }} onClick={next}>
            {queue.length === 1 && correct ? "過關" : "下一題"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
