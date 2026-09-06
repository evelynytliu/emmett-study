"use client";

// 排順序：把打亂的步驟依正確順序點回去。
//   點對 → 移進「已排好」清單；點錯 → 那一格晃一下、算一次失誤（不告訴他正確是哪個）。
//   全部排完顯示「一次就對 X / N」；最佳成績存本機。也可切「看順序」模式直接讀。

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, ListOrdered, RotateCcw } from "lucide-react";

export interface SequenceItem {
  id: string;
  label: string;
  detail?: string;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // 避免洗完剛好是正確順序
  if (a.every((x, i) => x === arr[i]) && a.length > 1) [a[0], a[1]] = [a[1], a[0]];
  return a;
}

export function SequenceGame({
  items,
  color,
  soft,
  storageKey,
}: {
  items: SequenceItem[];
  color: string;
  soft: string;
  storageKey: string;
}) {
  const [mode, setMode] = React.useState<"study" | "play">("study");
  const [pool, setPool] = React.useState<SequenceItem[]>([]);
  const [placed, setPlaced] = React.useState<SequenceItem[]>([]);
  const [misses, setMisses] = React.useState(0);
  const [missedIds, setMissedIds] = React.useState<Set<string>>(new Set());
  const [shake, setShake] = React.useState<string | null>(null);
  const [best, setBest] = React.useState<number | null>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setBest(Number(raw));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const total = items.length;
  const done = mode === "play" && placed.length === total;
  // 一次就對＝那一步從沒點錯過就點對
  const firstTry = total - missedIds.size;

  React.useEffect(() => {
    if (!done) return;
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

  function start() {
    setMode("play");
    setPool(shuffled(items));
    setPlaced([]);
    setMisses(0);
    setMissedIds(new Set());
    setShake(null);
  }

  function pick(it: SequenceItem) {
    const expected = items[placed.length];
    if (it.id === expected.id) {
      setPlaced((p) => [...p, it]);
      setPool((p) => p.filter((x) => x.id !== it.id));
    } else {
      setMisses((m) => m + 1);
      setMissedIds((s) => new Set(s).add(expected.id));
      setShake(it.id);
      window.setTimeout(() => setShake((x) => (x === it.id ? null : x)), 500);
    }
  }

  const btn = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors",
      active ? "text-white" : "border bg-card text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setMode("study")} className={btn(mode === "study")} style={mode === "study" ? { background: color } : undefined}>
          <Eye className="h-3.5 w-3.5" /> 看順序
        </button>
        <button type="button" onClick={start} className={btn(mode === "play")} style={mode === "play" ? { background: color } : undefined}>
          <ListOrdered className="h-3.5 w-3.5" /> 自己排
        </button>
        <span className="flex-1" />
        {mode === "play" && (
          <span className="font-mono text-xs text-muted-foreground">
            {placed.length}/{total}・失誤 {misses}
            {best !== null && <span className="ml-2">最佳一次就對 {best}</span>}
          </span>
        )}
      </div>

      {mode === "study" ? (
        <ol className="space-y-2">
          {items.map((it, i) => (
            <li key={it.id} className="flex gap-3 rounded-xl border p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-black text-white" style={{ background: color }}>
                {i + 1}
              </span>
              <div>
                <div className="font-bold">{it.label}</div>
                {it.detail && <div className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{it.detail}</div>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 已排好 */}
          <div>
            <div className="mb-1.5 font-mono text-[11px] font-bold tracking-widest text-muted-foreground">已排好（由上到下）</div>
            <ol className="min-h-[120px] space-y-1.5 rounded-xl p-2" style={{ background: soft }}>
              {placed.map((it, i) => (
                <li key={it.id} className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm font-bold shadow-sm">
                  <span className="font-mono text-xs" style={{ color }}>{i + 1}</span>
                  {it.label}
                </li>
              ))}
              {!done && (
                <li className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
                  第 {placed.length + 1} 步是哪一個？從右邊點。
                </li>
              )}
            </ol>
          </div>
          {/* 待選 */}
          <div>
            <div className="mb-1.5 font-mono text-[11px] font-bold tracking-widest text-muted-foreground">還沒排的</div>
            {done ? (
              <div className="rounded-xl p-3" style={{ background: soft }}>
                <div className="text-sm font-bold">{firstTry === total ? "全部一次就對！" : "排完了"}</div>
                <div className="mt-1 text-2xl font-black tabular-nums" style={{ color }}>
                  {firstTry} / {total}
                  <span className="ml-1 text-xs font-bold text-muted-foreground">一次就對</span>
                </div>
                {missedIds.size > 0 && (
                  <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    卡住的步驟：{items.filter((x) => missedIds.has(x.id)).map((x) => x.label).join("、")}
                  </div>
                )}
                <button type="button" onClick={start} className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-white" style={{ background: color }}>
                  <RotateCcw className="h-3.5 w-3.5" /> 再排一次
                </button>
              </div>
            ) : (
              <div className="grid gap-1.5">
                {pool.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => pick(it)}
                    className={cn(
                      "rounded-lg border bg-card px-3 py-2 text-left text-sm font-bold transition-colors hover:border-primary/50",
                      shake === it.id && "animate-pop border-gentle bg-gentle/15 text-gentle-foreground",
                    )}
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
