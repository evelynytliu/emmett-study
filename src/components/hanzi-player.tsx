"use client";

// 形音義精熟循環引擎（Epop 式）。
//
// 跟通用題組的差別：答錯的題不只回鍋，還要「連續答對 2 次」才過關，
// 而且回鍋題會安插在幾題之後馬上再考（不是排到最尾端），確保當下就補起來。
//
// 兩種作答方式：
//   - 注音題：站內注音鍵盤（iPad 不用切輸入法）
//   - 國字題：手寫板寫字 → 線上辨識；辨識連不上退回「對照答案自評」

import * as React from "react";
import Link from "next/link";
import type { HanziSet, HanziQuestion } from "@/content/hanzi/types";
import { getSubject } from "@/content/subjects";
import { saveHanziAttempt } from "@/lib/hanzi-storage";
import { recognizeHandwriting, type Stroke } from "@/lib/handwriting";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Delete,
  Eraser,
  Lightbulb,
  RotateCcw,
  Target,
  Trophy,
  Undo2,
  XCircle,
} from "lucide-react";

// ── 注音比對 ────────────────────────────────────────────
// 忽略空白；輕聲「˙」不管打在前面（課本寫法）或後面都算對。
function normalizeZhuyin(s: string): string {
  let t = s.replace(/[\sˉ]/g, "");
  if (t.includes("˙")) t = t.replace(/˙/g, "") + "˙";
  return t;
}

const ZHUYIN_KEYS = [
  "ㄅㄆㄇㄈㄉㄊㄋㄌ",
  "ㄍㄎㄏㄐㄑㄒ",
  "ㄓㄔㄕㄖㄗㄘㄙ",
  "ㄧㄨㄩㄚㄛㄜㄝ",
  "ㄞㄟㄠㄡㄢㄣㄤㄥㄦ",
];
const TONE_KEYS = ["ˊ", "ˇ", "ˋ", "˙"];

function ZhuyinPad({
  value,
  onChange,
  disabled,
  color,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  color: string;
}) {
  const key = (k: string) => (
    <button
      key={k}
      type="button"
      disabled={disabled}
      onClick={() => onChange(value + k)}
      className="h-11 min-w-[2.4rem] flex-1 rounded-lg border bg-background text-lg font-medium transition-colors hover:bg-secondary active:scale-95 disabled:opacity-40"
    >
      {k}
    </button>
  );
  return (
    <div className="mt-3 select-none space-y-1.5" aria-label="注音鍵盤">
      {ZHUYIN_KEYS.map((row) => (
        <div key={row} className="flex gap-1.5">
          {row.split("").map(key)}
        </div>
      ))}
      <div className="flex gap-1.5">
        {TONE_KEYS.map((t) => (
          <button
            key={t}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value + t)}
            className="h-11 flex-1 rounded-lg border text-xl font-bold transition-colors hover:opacity-80 active:scale-95 disabled:opacity-40"
            style={{ background: `${color}18`, color }}
          >
            {t === "˙" ? "˙輕" : t}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={() => onChange(value.slice(0, -1))}
          className="flex h-11 flex-1 items-center justify-center rounded-lg border bg-background transition-colors hover:bg-secondary active:scale-95 disabled:opacity-40"
          aria-label="退格"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// ── 手寫板 ──────────────────────────────────────────────
const PAD = 240; // 邏輯畫布尺寸（正方形）

export interface HandwritingBoxHandle {
  getStrokes: () => Stroke[];
  clear: () => void;
}

const HandwritingBox = React.forwardRef<
  HandwritingBoxHandle,
  { disabled: boolean; onStrokesChange: (n: number) => void }
>(function HandwritingBox({ disabled, onStrokesChange }, ref) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const strokesRef = React.useRef<Stroke[]>([]);
  const drawingRef = React.useRef(false);

  const redraw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, PAD, PAD);
    // 田字格輔助線
    ctx.save();
    ctx.strokeStyle = "rgba(120,120,140,0.18)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(PAD / 2, 0);
    ctx.lineTo(PAD / 2, PAD);
    ctx.moveTo(0, PAD / 2);
    ctx.lineTo(PAD, PAD / 2);
    ctx.moveTo(0, 0);
    ctx.lineTo(PAD, PAD);
    ctx.moveTo(PAD, 0);
    ctx.lineTo(0, PAD);
    ctx.stroke();
    ctx.restore();
    // 筆跡
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "hsl(230 20% 20%)";
    for (const [xs, ys] of strokesRef.current) {
      ctx.beginPath();
      xs.forEach((x, i) => {
        if (i === 0) ctx.moveTo(x, ys[i]);
        else ctx.lineTo(x, ys[i]);
      });
      if (xs.length === 1) ctx.lineTo(xs[0] + 0.1, ys[0] + 0.1);
      ctx.stroke();
    }
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = PAD * dpr;
    canvas.height = PAD * dpr;
    redraw();
  }, [redraw]);

  React.useImperativeHandle(ref, () => ({
    getStrokes: () => strokesRef.current,
    clear: () => {
      strokesRef.current = [];
      onStrokesChange(0);
      redraw();
    },
  }));

  function pos(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [
      Math.round(((e.clientX - rect.left) / rect.width) * PAD),
      Math.round(((e.clientY - rect.top) / rect.height) * PAD),
    ] as const;
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <canvas
        ref={canvasRef}
        style={{ width: PAD, height: PAD, touchAction: "none" }}
        className={cn(
          "rounded-2xl border-2 border-dashed bg-background shadow-inner",
          disabled && "pointer-events-none opacity-60",
        )}
        onPointerDown={(e) => {
          if (disabled) return;
          e.preventDefault();
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
          drawingRef.current = true;
          const [x, y] = pos(e);
          strokesRef.current.push([[x], [y]]);
          redraw();
        }}
        onPointerMove={(e) => {
          if (!drawingRef.current) return;
          const stroke = strokesRef.current[strokesRef.current.length - 1];
          const [x, y] = pos(e);
          stroke[0].push(x);
          stroke[1].push(y);
          redraw();
        }}
        onPointerUp={() => {
          if (!drawingRef.current) return;
          drawingRef.current = false;
          onStrokesChange(strokesRef.current.length);
        }}
        onPointerCancel={() => {
          drawingRef.current = false;
        }}
      />
      <div className="flex gap-2 sm:flex-col">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            strokesRef.current.pop();
            onStrokesChange(strokesRef.current.length);
            redraw();
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <Undo2 className="h-4 w-4" /> 上一筆
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            strokesRef.current = [];
            onStrokesChange(0);
            redraw();
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <Eraser className="h-4 w-4" /> 全部清掉
        </button>
      </div>
    </div>
  );
});

// ── 題幹渲染：把【目標】高亮成大字 ──────────────────────
function Sentence({
  q,
  color,
  hideAnswer,
}: {
  q: HanziQuestion;
  color: string;
  hideAnswer?: boolean;
}) {
  const m = q.sentence.match(/^(.*)【(.+?)】(.*)$/s);
  if (!m) return <p className="text-lg leading-loose">{q.sentence}</p>;
  const [, pre, target, post] = m;
  return (
    <p className="text-lg leading-loose">
      {pre}
      <span
        className="mx-0.5 inline-flex min-w-[2.2rem] items-center justify-center rounded-lg border-b-4 px-2 py-0.5 align-middle text-xl font-black"
        style={{ borderColor: color, background: `${color}14`, color }}
      >
        {hideAnswer ? "？" : target}
      </span>
      {post}
    </p>
  );
}

// ── 精熟循環主引擎 ──────────────────────────────────────
const NEED_AFTER_WRONG = 2; // 答錯後要連續答對幾次才過關
const REINSERT_GAP = 3; // 回鍋題安插在幾題之後

type Phase = "answering" | "feedback" | "selfjudge" | "done";

interface Feedback {
  correct: boolean;
  recognized?: string[]; // 手寫辨識候選字（給孩子看「機器看到什麼」）
  bySelfJudge?: boolean;
}

export function HanziPlayer({ set }: { set: HanziSet }) {
  const subject = getSubject("chinese");
  const color = subject?.color.main ?? "hsl(350 72% 52%)";
  const total = set.questions.length;

  const [queue, setQueue] = React.useState<string[]>(() =>
    set.questions.map((q) => q.id),
  );
  const [need, setNeed] = React.useState<Record<string, number>>({});
  const [attempted, setAttempted] = React.useState<Set<string>>(new Set());
  const [firstTry, setFirstTry] = React.useState<Record<string, boolean>>({});
  const [mastered, setMastered] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>("answering");
  const [fb, setFb] = React.useState<Feedback | null>(null);
  const [typed, setTyped] = React.useState("");
  const [strokeCount, setStrokeCount] = React.useState(0);
  const [checking, setChecking] = React.useState(false);
  const [selfJudged, setSelfJudged] = React.useState(0);
  const [saved, setSaved] = React.useState(false);
  const padRef = React.useRef<HandwritingBoxHandle>(null);

  const current = set.questions.find((q) => q.id === queue[0]);

  function record(correct: boolean, extra?: Partial<Feedback>) {
    if (!current) return;
    if (!attempted.has(current.id)) {
      setAttempted((s) => new Set(s).add(current.id));
      setFirstTry((m) => ({ ...m, [current.id]: correct }));
    }
    setFb({ correct, ...extra });
    setPhase("feedback");
  }

  async function submit() {
    if (!current || checking) return;
    if (current.kind === "zhuyin") {
      record(normalizeZhuyin(typed) === normalizeZhuyin(current.answer));
      return;
    }
    // 國字題：手寫辨識
    setChecking(true);
    const strokes = padRef.current?.getStrokes() ?? [];
    const candidates = await recognizeHandwriting(strokes, PAD, PAD);
    setChecking(false);
    if (candidates === null) {
      // 辨識不可用 → 自評模式（顯示正解，讓孩子對照自己寫的字）
      setPhase("selfjudge");
      return;
    }
    const hit = candidates.slice(0, 8).includes(current.answer);
    record(hit, { recognized: candidates.slice(0, 3) });
  }

  function selfJudge(correct: boolean) {
    if (correct) setSelfJudged((n) => n + 1);
    record(correct, { bySelfJudge: true });
  }

  function next() {
    if (!current || !fb) return;
    const rest = queue.slice(1);
    let nextQueue: string[];
    if (fb.correct) {
      const remaining = (need[current.id] ?? 1) - 1;
      if (remaining <= 0) {
        setMastered((n) => n + 1);
        nextQueue = rest;
      } else {
        setNeed((m) => ({ ...m, [current.id]: remaining }));
        nextQueue = [...rest];
        nextQueue.splice(Math.min(REINSERT_GAP, rest.length), 0, current.id);
      }
    } else {
      setNeed((m) => ({ ...m, [current.id]: NEED_AFTER_WRONG }));
      nextQueue = [...rest];
      nextQueue.splice(Math.min(REINSERT_GAP, rest.length), 0, current.id);
    }
    setTyped("");
    setStrokeCount(0);
    setFb(null);
    padRef.current?.clear();
    if (nextQueue.length === 0) {
      setPhase("done");
      if (!saved) {
        setSaved(true);
        const firstTryCorrect = set.questions.filter(
          (q) => firstTry[q.id],
        ).length;
        void saveHanziAttempt({
          setId: set.id,
          firstTryCorrect,
          total,
          wrongQuestionIds: set.questions
            .filter((q) => !firstTry[q.id])
            .map((q) => q.id),
          selfJudged,
          finishedAt: new Date().toISOString(),
        });
      }
    } else {
      setQueue(nextQueue);
      setPhase("answering");
    }
  }

  function restart() {
    setQueue(set.questions.map((q) => q.id));
    setNeed({});
    setAttempted(new Set());
    setFirstTry({});
    setMastered(0);
    setPhase("answering");
    setFb(null);
    setTyped("");
    setStrokeCount(0);
    setSelfJudged(0);
    setSaved(false);
    padRef.current?.clear();
  }

  // ── 結算 ──
  if (phase === "done") {
    const firstTryCorrect = set.questions.filter((q) => firstTry[q.id]).length;
    const perfect = firstTryCorrect === total;
    const wrongOnes = set.questions.filter((q) => !firstTry[q.id]);
    return (
      <div className="flex flex-1 flex-col py-10">
        <BackLink />
        <div className="animate-fade-in rounded-2xl border bg-card p-8 text-center shadow-soft">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{ background: subject?.color.soft }}
          >
            {perfect ? "🏆" : "💪"}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
            {perfect ? "全部一次就對，字音字形高手！" : "每個字都拿下了，過關！"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {set.title}・共 {total} 個字
          </p>
          <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-6">
            <div>
              <div className="text-3xl font-black" style={{ color }}>
                {firstTryCorrect}/{total}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                一次就對（實力分）
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-correct">100%</div>
              <div className="mt-1 text-xs text-muted-foreground">
                最後全數精熟
              </div>
            </div>
          </div>
          {selfJudged > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              有 {selfJudged} 題因為手寫辨識連不上，是自己對照答案判定的。
            </p>
          )}
          {!perfect && (
            <div className="mx-auto mt-6 max-w-md rounded-xl bg-secondary/60 p-4 text-left text-sm leading-relaxed">
              <p className="font-medium">回鍋練過的字，考點是：</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {wrongOnes.map((q) => (
                  <li key={q.id} className="flex items-start gap-2">
                    <Target className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
                    <span>
                      <b style={{ color }}>{q.answer}</b>　{q.concept}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-muted-foreground">
                這些字剛剛已經連續答對兩次了——過幾天再回來考一輪，
                「一次就對」的分數會告訴你是不是真的記住了。
              </p>
            </div>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={restart}
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              <RotateCcw className="h-4 w-4" />
              再挑戰一次
            </button>
            <Link
              href="/subject/chinese"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ background: subject?.color.grad }}
            >
              回國文基地
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const isFirstVisit = !attempted.has(current.id);
  const needMore = need[current.id];
  const progress = total ? mastered / total : 0;
  const canSubmit =
    current.kind === "zhuyin" ? typed.trim().length > 0 : strokeCount > 0;

  return (
    <div className="flex flex-1 flex-col py-10">
      <BackLink />

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
            style={{ background: color }}
          >
            📜 國文・形音義
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
            {current.kind === "zhuyin" ? "看字寫注音" : "看注音寫國字"}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
          {set.title}
        </h1>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              已精熟 {mastered}/{total} 個字
              {queue.length > total - mastered && "（有字回鍋中）"}
            </span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%`, background: subject?.color.grad }}
            />
          </div>
        </div>
      </header>

      <div className="animate-fade-in rounded-2xl border bg-card p-6 shadow-soft sm:p-8">
        {phase !== "feedback" && !isFirstVisit && (
          <span className="mb-2 inline-block rounded-full bg-gentle/15 px-2 py-0.5 text-xs font-medium text-gentle">
            回鍋字・還要連對 {needMore ?? 1} 次才過關
          </span>
        )}

        <Sentence q={current} color={color} />

        <p className="mt-3 text-sm text-muted-foreground">
          {current.kind === "zhuyin"
            ? "這個字怎麼唸？用下面的注音鍵盤拼出來（一聲不用加調號）。"
            : "這個注音是哪個字？在手寫板上一筆一畫寫出來。"}
        </p>

        {/* 作答區 */}
        {current.kind === "zhuyin" ? (
          <>
            <div
              className="mt-4 flex h-14 items-center rounded-xl border bg-background px-4 text-3xl font-bold tracking-widest"
              style={{ color }}
              aria-label="你的注音"
            >
              {typed || (
                <span className="text-base font-normal text-muted-foreground">
                  點下面的注音符號作答…
                </span>
              )}
            </div>
            <ZhuyinPad
              value={typed}
              onChange={setTyped}
              disabled={phase !== "answering"}
              color={color}
            />
          </>
        ) : (
          <HandwritingBox
            ref={padRef}
            disabled={phase !== "answering"}
            onStrokesChange={setStrokeCount}
          />
        )}

        {/* 送出 / 自評 / 回饋 */}
        {phase === "answering" && (
          <button
            onClick={submit}
            disabled={!canSubmit || checking}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: subject?.color.grad }}
          >
            {checking ? "辨識中…" : "對答案"}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {phase === "selfjudge" && (
          <div className="animate-fade-in mt-6 rounded-xl bg-secondary/60 p-4">
            <p className="text-sm text-muted-foreground">
              手寫辨識暫時連不上，改用對照模式——正確答案是：
            </p>
            <div
              className="my-3 inline-flex h-16 w-16 items-center justify-center rounded-xl border-2 text-4xl font-black"
              style={{ borderColor: color, color }}
            >
              {current.answer}
            </div>
            <p className="text-sm font-medium">跟你寫的字一模一樣嗎？（誠實比分數重要）</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => selfJudge(true)}
                className="rounded-xl bg-correct px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                一樣，我寫對了
              </button>
              <button
                onClick={() => selfJudge(false)}
                className="rounded-xl border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
              >
                不一樣，算我錯
              </button>
            </div>
          </div>
        )}

        {phase === "feedback" && fb && (
          <div className="animate-fade-in mt-6">
            <div
              className={cn(
                "rounded-xl p-4",
                fb.correct ? "bg-correct/10" : "bg-gentle/10",
              )}
            >
              <p
                className={cn(
                  "flex items-center gap-2 font-bold",
                  fb.correct ? "text-correct" : "text-gentle",
                )}
              >
                {fb.correct ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" /> 答對了！
                    {!isFirstVisit && (need[current.id] ?? 1) > 1 && (
                      <span className="text-xs font-medium">
                        （回鍋字，再對 {(need[current.id] ?? 1) - 1} 次就過關）
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" />
                    還不對。正確答案：
                    <span className="text-xl" style={{ color: "inherit" }}>
                      {current.answer}
                    </span>
                    ——等一下會再考一次
                  </>
                )}
              </p>
              {fb.recognized && fb.recognized.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  手寫辨識看到的是：
                  {fb.recognized.map((c, i) => (
                    <span
                      key={i}
                      className={cn(
                        "mx-0.5 rounded border px-1.5 py-0.5 text-sm",
                        c === current.answer && "border-correct text-correct",
                      )}
                    >
                      {c}
                    </span>
                  ))}
                </p>
              )}
              <div className="mt-3 flex items-start gap-2 text-sm leading-relaxed">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
                <div>
                  <p className="whitespace-pre-line">{current.explanation}</p>
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    <Target className="mr-1 inline h-3.5 w-3.5" />
                    考點：{current.concept}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={next}
              autoFocus
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ background: subject?.color.grad }}
            >
              {queue.length === 1 && fb.correct && (need[current.id] ?? 1) <= 1 ? (
                <>
                  看成績 <Trophy className="h-4 w-4" />
                </>
              ) : (
                <>
                  下一題 <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/subject/chinese"
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      回國文基地
    </Link>
  );
}
