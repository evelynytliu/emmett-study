"use client";

// 家長頁的「數線闖關・關卡掌握狀況」：每一頁闖關列出各關「最佳一次就對／最近一次／玩幾次／
// 全對最快秒數／最近卡住的概念」，底下彙整「最常卡住的概念」。
// 資料來源：mission-storage（開頁時合併雲端，所以孩子在 iPad 玩、媽媽在電腦看也看得到）。
// 「AI 分析闖關」按一次呼叫一次 /api/mission-review；AI 不可用時退回 heuristicMissionReview。

import * as React from "react";
import Link from "next/link";
import { preps } from "@/content/prep";
import type { MissionLevel, PrepSection } from "@/content/prep/types";
import { getSubject } from "@/content/subjects";
import { missionUid, syncMissionPool, type MissionPoolState, type MissionRecord } from "@/lib/mission-storage";
import {
  heuristicMissionReview,
  requestMissionReview,
  type MissionLevelSignal,
  type MissionReview,
  type MissionReviewRequest,
} from "@/lib/mission-review";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Flag, Lock, Wand2 } from "lucide-react";

type MissionSection = Extract<PrepSection, { kind: "mission" }>;

interface LevelRow {
  level: MissionLevel;
  index: number;
  rec: MissionRecord | null;
  unlocked: boolean;
}

// 存最近一次分析（本機），開頁直接顯示、不用每次重打 AI
const REVIEW_KEY = "gz-mission:review";
interface SavedReview {
  at: string;
  source: "ai" | "heuristic";
  review: MissionReview;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function MissionParentSummary() {
  const [pool, setPool] = React.useState<MissionPoolState | null>(null);
  const [saved, setSaved] = React.useState<SavedReview | null>(null);
  const [state, setState] = React.useState<"idle" | "loading" | "error">("idle");
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    void syncMissionPool().then(setPool);
    try {
      const raw = window.localStorage.getItem(REVIEW_KEY);
      if (raw) setSaved(JSON.parse(raw) as SavedReview);
    } catch {
      /* ignore */
    }
  }, []);

  // 所有闖關頁 × 區塊 × 關卡，配上紀錄
  const pages = React.useMemo(() => {
    if (!pool) return [];
    const out: { prepId: string; prepTitle: string; subjectId: string; si: number; rows: LevelRow[] }[] = [];
    for (const p of preps) {
      p.sections.forEach((s, si) => {
        if (s.kind !== "mission") return;
        const sec = s as MissionSection;
        const rows: LevelRow[] = sec.levels.map((level, index) => {
          const rec = pool[missionUid(p.id, si, level.id)] ?? null;
          const prevRec = index === 0 ? true : Boolean(pool[missionUid(p.id, si, sec.levels[index - 1].id)]);
          return { level, index, rec, unlocked: prevRec };
        });
        out.push({ prepId: p.id, prepTitle: p.title, subjectId: p.subjectId, si, rows });
      });
    }
    return out;
  }, [pool]);

  const played = pages.flatMap((pg) => pg.rows.filter((r) => r.rec));
  if (!pool || played.length === 0) return null;

  // 最常卡住的概念（跨所有關卡）
  const missCount = new Map<string, number>();
  for (const r of played) for (const c of r.rec!.missed) missCount.set(c, (missCount.get(c) ?? 0) + 1);
  const topMissed = [...missCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  function buildRequest(): MissionReviewRequest {
    const levels: MissionLevelSignal[] = [];
    const locked: string[] = [];
    for (const pg of pages)
      for (const r of pg.rows) {
        if (r.rec) {
          levels.push({
            prepTitle: pg.prepTitle,
            levelTitle: r.level.title,
            goal: r.level.goal,
            drill: Boolean(r.level.generator),
            best: r.rec.best,
            lastFirstTry: r.rec.lastFirstTry ?? null,
            total: r.rec.total,
            plays: r.rec.plays,
            missed: r.rec.missed,
            bestSec: r.rec.bestSec ?? null,
          });
        } else locked.push(`${r.level.title}`);
      }
    return { levels, lockedLevels: locked };
  }

  async function analyze() {
    setState("loading");
    setMsg("");
    const req = buildRequest();
    const res = await requestMissionReview(req);
    const next: SavedReview = res.ok && res.review
      ? { at: new Date().toISOString(), source: "ai", review: res.review }
      : { at: new Date().toISOString(), source: "heuristic", review: heuristicMissionReview(req) };
    setSaved(next);
    try {
      window.localStorage.setItem(REVIEW_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    if (next.source === "heuristic") {
      setState("error");
      setMsg(`AI 暫時無法使用（${res.error ?? "unknown"}），先用離線規則分析。`);
    } else setState("idle");
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Flag className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold tracking-tight">數線闖關・關卡掌握</h2>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        「一次就對」是第一次作答就對的題數；「卡住的概念」是最近一次玩那一關時答錯的題。熟練場每次題目不同，看秒數有沒有進步。
      </p>

      <div className="space-y-3">
        {pages.map((pg) => {
          const subject = getSubject(pg.subjectId as "math");
          const color = subject?.color.main ?? "hsl(252 83% 62%)";
          const soft = subject?.color.soft ?? "hsl(252 83% 62% / 0.1)";
          const done = pg.rows.filter((r) => r.rec).length;
          if (done === 0) return null;
          return (
            <div key={`${pg.prepId}:${pg.si}`} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                {subject && (
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: soft, color }}>
                    {subject.name}
                  </span>
                )}
                <Link href={`/prep/${pg.prepId}`} className="font-bold hover:underline">
                  {pg.prepTitle}
                </Link>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  過了 {done} / {pg.rows.length} 關
                </span>
              </div>
              <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {pg.rows.map(({ level, index, rec, unlocked }) => {
                  const perfect = rec && rec.best === rec.total;
                  return (
                    <li key={level.id} className={cn("flex items-start gap-2.5 rounded-xl border px-3 py-2 text-sm", !rec && "opacity-60")}>
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-black"
                        style={rec ? { background: perfect ? color : soft, color: perfect ? "white" : color } : undefined}
                      >
                        {!unlocked ? <Lock className="h-3 w-3 text-muted-foreground" /> : perfect ? <Check className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{level.title}</span>
                        {rec ? (
                          <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                            最佳 <b className={cn(perfect ? "text-correct" : "text-foreground")}>{rec.best}</b>/{rec.total}
                            {rec.lastFirstTry != null && rec.lastFirstTry !== rec.best && `・最近 ${rec.lastFirstTry}/${rec.total}`}
                            ・{rec.plays} 次{rec.bestSec != null && `・最快 ${rec.bestSec} 秒`}
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-xs text-muted-foreground">{unlocked ? "還沒玩" : "還沒解鎖"}</span>
                        )}
                        {rec && rec.missed.length > 0 && (
                          <span className="mt-1 block text-xs leading-relaxed text-gentle-foreground">卡住：{rec.missed.join("、")}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>

      {topMissed.length > 0 && (
        <div className="mt-3 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="text-sm font-bold">最常卡住的概念</div>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {topMissed.map(([c, n]) => (
              <li key={c} className="rounded-full bg-gentle/20 px-2.5 py-1 text-xs font-bold text-gentle-foreground">
                {c}
                {n > 1 && <span className="ml-1 font-mono opacity-70">×{n}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI 分析 */}
      <div className="mt-3 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">AI 分析闖關</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              把上面的紀錄送給 AI，整理成：哪些概念站穩、哪些還沒遷移（附證據）、下一步怎麼陪。按一次算一次。
            </div>
          </div>
          <button
            type="button"
            onClick={analyze}
            disabled={state === "loading"}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              state === "loading" ? "cursor-not-allowed bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {state === "loading" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                分析中…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" /> {saved ? "重新分析" : "用 AI 分析"}
              </>
            )}
          </button>
        </div>
        {msg && <p className="mt-2 text-xs text-destructive">{msg}</p>}

        {saved && (
          <div className="mt-4 space-y-3 border-t pt-4 text-sm leading-relaxed">
            <div className="text-xs text-muted-foreground">
              {saved.source === "ai" ? "AI 分析" : "離線規則分析"}・{fmtDate(saved.at)}
            </div>
            <p className="text-[15px]">{saved.review.summary}</p>
            {saved.review.stable.length > 0 && (
              <div>
                <div className="font-bold text-correct">站穩了</div>
                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                  {saved.review.stable.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {saved.review.weak.length > 0 && (
              <div>
                <div className="font-bold text-gentle-foreground">還沒遷移</div>
                <ul className="mt-1 space-y-2">
                  {saved.review.weak.map((w) => (
                    <li key={w.concept} className="rounded-xl bg-gentle/10 p-3">
                      <div className="font-bold">{w.concept}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">證據：{w.evidence}</div>
                      <div className="mt-1 flex items-start gap-1.5">
                        <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{w.action}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {saved.review.next_step && (
              <p>
                <span className="font-bold">下一步：</span>
                {saved.review.next_step}
              </p>
            )}
            {saved.review.parent_tip && (
              <p className="rounded-xl bg-secondary/60 p-3 text-muted-foreground">
                <span className="font-bold text-foreground">給媽媽：</span>
                {saved.review.parent_tip}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
