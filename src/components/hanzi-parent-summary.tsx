"use client";

// 家長頁的「形音義大作戰」摘要。
// 資料來源：mathconcept_hanzi_pool（題庫精熟狀態，跨裝置）＋
// mathconcept_hanzi_attempts（每輪成績歷史）。沒開雲端就用本機資料。

import * as React from "react";
import { allHanziQuestions } from "@/content/hanzi";
import {
  getHanziHistory,
  syncHanziPool,
  type HanziAttemptRow,
  type HanziPoolState,
} from "@/lib/hanzi-storage";
import { cn } from "@/lib/utils";
import { Brush, Target } from "lucide-react";
import type { HanziPoolQuestion } from "@/content/hanzi";

// 注音題的「字」在題幹的【】裡（answer 是注音）；國字題的 answer 就是字本身
function displayChar(q: HanziPoolQuestion): string {
  if (q.kind === "char") return q.answer;
  return q.sentence.match(/【(.+?)】/)?.[1] ?? q.answer;
}

export function HanziParentSummary() {
  const [data, setData] = React.useState<{
    pool: HanziPoolState;
    history: HanziAttemptRow[];
  } | null>(null);

  React.useEffect(() => {
    void Promise.all([syncHanziPool(), getHanziHistory()]).then(
      ([pool, history]) => setData({ pool, history }),
    );
  }, []);

  if (!data) return null;

  const total = allHanziQuestions.length;
  const mastered = allHanziQuestions.filter((q) => data.pool[q.uid]?.m).length;
  const rounds = data.history.length;
  if (mastered === 0 && rounds === 0) return null;

  const latest = data.history[0] ?? null;
  const selfJudgedTotal = data.history.reduce((n, a) => n + a.selfJudged, 0);
  // 錯最多次的字（含目前仍未精熟的標記）
  const weakChars = allHanziQuestions
    .map((q) => ({
      q,
      wrong: data.pool[q.uid]?.w ?? 0,
      masteredNow: data.pool[q.uid]?.m ?? false,
    }))
    .filter((x) => x.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 10);

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Brush className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold tracking-tight">
          國文・形音義大作戰
        </h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        每輪 10 個字；「一次就對」才算精熟，答錯的字之後每輪都會再出，直到過關。
      </p>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        {/* 統計列 */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <div className="text-2xl font-black text-primary">
              {mastered}/{total}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              題庫累計精熟
            </div>
          </div>
          <div>
            <div className="text-2xl font-black">{rounds}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">練過的輪數</div>
          </div>
          {latest && (
            <div>
              <div className="text-2xl font-black text-correct">
                {latest.firstTryCorrect}/{latest.total}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                最近一輪一次就對
              </div>
            </div>
          )}
        </div>

        {/* 精熟進度條 */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${total ? (mastered / total) * 100 : 0}%` }}
          />
        </div>

        {/* 每輪成績走勢（新→舊） */}
        {rounds > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs text-muted-foreground">
              每輪「一次就對」走勢（左邊最新）
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {data.history.slice(0, 12).map((a, i) => {
                const full = a.total > 0 && a.firstTryCorrect === a.total;
                return (
                  <span
                    key={a.createdAt + i}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      i === 0 && "ring-1 ring-primary/40",
                      full
                        ? "bg-correct/15 text-correct"
                        : "bg-gentle/15 text-gentle-foreground",
                    )}
                    title={new Date(a.createdAt).toLocaleString("zh-TW")}
                  >
                    {a.firstTryCorrect}/{a.total}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 錯最多次的字 */}
        {weakChars.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              錯過的字（×錯的次數；打勾＝後來已精熟）
            </p>
            <div className="flex flex-wrap gap-1.5">
              {weakChars.map(({ q, wrong, masteredNow }) => (
                <span
                  key={q.uid}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs",
                    masteredNow
                      ? "bg-secondary text-muted-foreground"
                      : "bg-gentle/10 text-gentle-foreground",
                  )}
                  title={q.concept}
                >
                  <Target className="h-3 w-3" />
                  <span className="text-sm font-bold">{displayChar(q)}</span>
                  {q.concept}
                  {wrong > 1 && <span className="font-semibold">×{wrong}</span>}
                  {masteredNow && <span className="text-correct">✓</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {selfJudgedTotal > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            有 {selfJudgedTotal} 題是手寫辨識連不上時，孩子自己對照答案判定的。
          </p>
        )}
      </div>
    </section>
  );
}
