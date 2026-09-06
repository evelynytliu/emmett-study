"use client";

// 點圖認部位：一張示意圖＋熱點，三種玩法。
//   看標籤：全部標籤打開，先讀一遍。
//   認名稱：點一個熱點 → 四選一選名稱。答錯不給答案，讓他再選；「一次就對」才算。
//   找位置：畫面給名稱 → 點對應的熱點。點錯的熱點會短暫顯示它的名稱（順便學）。
// 每輪結束顯示「一次就對 X / N」，最佳成績存本機（純激勵）。

import * as React from "react";
import type { PrepHotspot, PrepFigure } from "@/content/prep/types";
import { FIGURES } from "./prep-figures";
import { cn } from "@/lib/utils";
import { Eye, MousePointerClick, Search, RotateCcw } from "lucide-react";

type Mode = "study" | "name" | "find";

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function DiagramGame({
  figure,
  hotspots,
  color,
  soft,
  storageKey,
}: {
  figure: PrepFigure;
  hotspots: PrepHotspot[];
  color: string;
  soft: string;
  storageKey: string;
}) {
  const Figure = FIGURES[figure];
  const [mode, setMode] = React.useState<Mode>("study");
  // 已答對（顯示標籤）的熱點；曾經答錯過的熱點（不算一次就對）
  const [solved, setSolved] = React.useState<Set<string>>(new Set());
  const [missed, setMissed] = React.useState<Set<string>>(new Set());
  // 認名稱：目前點選的熱點與它的四個選項
  const [picked, setPicked] = React.useState<string | null>(null);
  const [choices, setChoices] = React.useState<string[]>([]);
  const [wrongChoice, setWrongChoice] = React.useState<string | null>(null);
  // 找位置：出題順序與目前題目
  const [queue, setQueue] = React.useState<string[]>([]);
  const [flash, setFlash] = React.useState<string | null>(null); // 點錯時短暫顯示名稱的熱點
  const [best, setBest] = React.useState<number | null>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setBest(Number(raw));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const total = hotspots.length;
  const done = solved.size === total;
  const firstTry = hotspots.filter((h) => solved.has(h.id) && !missed.has(h.id)).length;

  React.useEffect(() => {
    if (!done || mode === "study") return;
    try {
      if (best === null || firstTry > best) {
        window.localStorage.setItem(storageKey, String(firstTry));
        setBest(firstTry);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function start(m: Mode) {
    setMode(m);
    setSolved(new Set());
    setMissed(new Set());
    setPicked(null);
    setChoices([]);
    setWrongChoice(null);
    setFlash(null);
    setQueue(m === "find" ? shuffled(hotspots.map((h) => h.id)) : []);
  }

  const byId = (id: string) => hotspots.find((h) => h.id === id)!;
  const target = mode === "find" ? queue[0] : null;

  function clickHotspot(id: string) {
    if (mode === "study") return;
    if (solved.has(id)) return;
    if (mode === "name") {
      if (picked === id) return;
      const others = shuffled(hotspots.filter((h) => h.id !== id).map((h) => h.name))
        .filter((n, i, arr) => arr.indexOf(n) === i && n !== byId(id).name)
        .slice(0, 3);
      setChoices(shuffled([byId(id).name, ...others]));
      setPicked(id);
      setWrongChoice(null);
      return;
    }
    // find
    if (!target) return;
    if (id === target) {
      setSolved((s) => new Set(s).add(id));
      setQueue((q) => q.slice(1));
      setFlash(null);
    } else {
      setMissed((s) => new Set(s).add(target));
      setFlash(id);
      window.setTimeout(() => setFlash((f) => (f === id ? null : f)), 1200);
    }
  }

  function answerName(name: string) {
    if (!picked) return;
    if (name === byId(picked).name) {
      setSolved((s) => new Set(s).add(picked));
      setPicked(null);
      setChoices([]);
      setWrongChoice(null);
    } else {
      setMissed((s) => new Set(s).add(picked));
      setWrongChoice(name);
    }
  }

  const showLabel = (h: PrepHotspot) =>
    mode === "study" || solved.has(h.id) || flash === h.id;

  const modeBtn = (m: Mode, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => start(m)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors",
        mode === m ? "text-white" : "border bg-card text-muted-foreground hover:text-foreground",
      )}
      style={mode === m ? { background: color } : undefined}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {modeBtn("study", <Eye className="h-3.5 w-3.5" />, "看標籤")}
        {modeBtn("name", <MousePointerClick className="h-3.5 w-3.5" />, "認名稱")}
        {modeBtn("find", <Search className="h-3.5 w-3.5" />, "找位置")}
        <span className="flex-1" />
        {mode !== "study" && (
          <span className="font-mono text-xs text-muted-foreground">
            {solved.size}/{total}
            {best !== null && <span className="ml-2">最佳一次就對 {best}</span>}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        {/* 圖 */}
        <div className="relative mx-auto w-full max-w-[420px]">
          <svg viewBox="0 0 200 260" className="h-auto w-full select-none" role="img" aria-label="示意圖">
            <Figure />
            {hotspots.map((h, i) => {
              const isSolved = solved.has(h.id);
              const isPicked = picked === h.id;
              const isFlash = flash === h.id;
              const labelX = h.side === "left" ? h.x - 9 : h.x + 9;
              const anchor = h.side === "left" ? "end" : "start";
              return (
                <g
                  key={h.id}
                  onClick={() => clickHotspot(h.id)}
                  className={cn(mode !== "study" && !isSolved && "cursor-pointer")}
                >
                  <circle
                    cx={h.x}
                    cy={h.y}
                    r={isPicked ? 8 : 6.5}
                    fill={isSolved ? "hsl(162 70% 40%)" : isFlash ? "hsl(38 95% 53%)" : mode === "study" ? color : "white"}
                    stroke={isSolved ? "hsl(162 70% 32%)" : color}
                    strokeWidth={isPicked ? 2.5 : 1.6}
                  />
                  <text
                    x={h.x}
                    y={h.y + 2.4}
                    textAnchor="middle"
                    fontSize="6.5"
                    fontWeight="700"
                    fill={isSolved || mode === "study" || isFlash ? "white" : color}
                    fontFamily="ui-monospace, monospace"
                  >
                    {i + 1}
                  </text>
                  {showLabel(h) && (
                    <text
                      x={labelX}
                      y={h.y + 2.6}
                      textAnchor={anchor}
                      fontSize="7.5"
                      fontWeight="800"
                      fill={isFlash ? "hsl(28 55% 24%)" : "hsl(240 28% 18%)"}
                      stroke="white"
                      strokeWidth="2.5"
                      paintOrder="stroke"
                    >
                      {h.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* 側欄：題目／選項／結果 */}
        <div className="flex flex-col gap-3">
          {mode === "study" && (
            <div className="rounded-xl p-3 text-sm leading-relaxed text-muted-foreground" style={{ background: soft }}>
              先把每個號碼對應的名稱讀一遍，想一下它「為什麼在那個位置」。
              讀完點「認名稱」或「找位置」開始練。
            </div>
          )}

          {mode === "name" && !done && (
            <div className="rounded-xl border p-3">
              {picked ? (
                <>
                  <div className="mb-2 text-sm font-bold">
                    第 {hotspots.findIndex((h) => h.id === picked) + 1} 號是哪個部位？
                  </div>
                  <div className="grid gap-1.5">
                    {choices.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => answerName(c)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-left text-sm font-bold transition-colors hover:border-primary/50",
                          wrongChoice === c && "border-gentle bg-gentle/15 text-gentle-foreground line-through",
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {wrongChoice && (
                    <p className="mt-2 text-xs text-gentle-foreground">不是這個，再想一下它的位置和功能。</p>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">點圖上任何一個白色號碼，選出它的名稱。</div>
              )}
            </div>
          )}

          {mode === "find" && !done && target && (
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">請在圖上點出</div>
              <div className="mt-1 text-2xl font-black tracking-tight" style={{ color }}>
                {byId(target).name}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                還剩 {queue.length} 個。點錯的會短暫亮出名稱。
              </div>
            </div>
          )}

          {mode !== "study" && done && (
            <div className="rounded-xl p-3" style={{ background: soft }}>
              <div className="text-sm font-bold">
                {firstTry === total ? "全部一次就對！" : "這輪完成"}
              </div>
              <div className="mt-1 text-2xl font-black tabular-nums" style={{ color }}>
                {firstTry} / {total}
                <span className="ml-1 text-xs font-bold text-muted-foreground">一次就對</span>
              </div>
              {missed.size > 0 && (
                <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  再看一次：{hotspots.filter((h) => missed.has(h.id)).map((h) => h.name).join("、")}
                </div>
              )}
              <button
                type="button"
                onClick={() => start(mode)}
                className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-white"
                style={{ background: color }}
              >
                <RotateCcw className="h-3.5 w-3.5" /> 再一輪
              </button>
            </div>
          )}

          {/* 號碼對照（練習時只列號碼，答對才顯示名稱） */}
          <ol className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-1">
            {hotspots.map((h, i) => {
              const show = showLabel(h);
              return (
                <li key={h.id} className="flex items-center gap-1.5">
                  <span
                    className="inline-flex h-4.5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold"
                    style={{ background: solved.has(h.id) ? "hsl(162 70% 40% / 0.15)" : soft, color: solved.has(h.id) ? "hsl(162 70% 32%)" : color }}
                  >
                    {i + 1}
                  </span>
                  <span className={cn(!show && "text-muted-foreground")}>{show ? h.name : "？"}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
