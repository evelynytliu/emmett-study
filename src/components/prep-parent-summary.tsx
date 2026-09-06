"use client";

// 家長頁的「考前複習頁・翻卡掌握狀況」：每一頁有幾張卡、會了／再練／掌握／還沒翻，
// 以及今天到期要回鍋的張數。資料來源：prep-storage（開頁時合併雲端）。

import * as React from "react";
import Link from "next/link";
import { preps } from "@/content/prep";
import { getSubject } from "@/content/subjects";
import { cardUid, syncPrepPool, type PrepPoolState } from "@/lib/prep-storage";
import { todayIso } from "@/content/school";
import { cn } from "@/lib/utils";
import { ArrowRight, Layers } from "lucide-react";

interface PrepStat {
  total: number;
  got: number;
  mastered: number;
  again: number;
  unseen: number;
  due: number;
}

function statFor(prepId: string, pool: PrepPoolState, today: string): PrepStat {
  const p = preps.find((x) => x.id === prepId);
  const s: PrepStat = { total: 0, got: 0, mastered: 0, again: 0, unseen: 0, due: 0 };
  if (!p) return s;
  for (const sec of p.sections) {
    if (sec.kind !== "flashcards") continue;
    for (const c of sec.cards) {
      s.total += 1;
      const e = pool[cardUid(p.id, c.id)];
      if (!e) {
        s.unseen += 1;
        continue;
      }
      if (e.s === "mastered") s.mastered += 1;
      else if (e.s === "got") s.got += 1;
      else s.again += 1;
      if (e.s !== "mastered" && e.d <= today) s.due += 1;
    }
  }
  return s;
}

export function PrepParentSummary() {
  const [pool, setPool] = React.useState<PrepPoolState | null>(null);
  const [today, setToday] = React.useState("");

  React.useEffect(() => {
    setToday(todayIso());
    void syncPrepPool().then(setPool);
  }, []);

  if (!pool || preps.length === 0) return null;
  const rows = preps
    .map((p) => ({ prep: p, stat: statFor(p.id, pool, today) }))
    .filter((r) => r.stat.total > 0);
  if (rows.length === 0) return null;
  const touched = rows.filter((r) => r.stat.unseen < r.stat.total);
  if (touched.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Layers className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold tracking-tight">考前複習頁・翻卡掌握</h2>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        「再練」是孩子自己標的沒會，會依 1→3→7→14→30 天回鍋；連對 5 次算掌握。
      </p>
      <div className="space-y-2">
        {touched.map(({ prep, stat }) => {
          const subject = getSubject(prep.subjectId);
          const seen = stat.total - stat.unseen;
          const pct = (n: number) => `${(n / stat.total) * 100}%`;
          return (
            <Link
              key={prep.id}
              href={`/prep/${prep.id}`}
              className="group block rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-2">
                {subject && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold"
                    style={{ background: subject.color.soft, color: subject.color.main }}
                  >
                    {subject.name}
                  </span>
                )}
                <span className="font-bold">{prep.title}</span>
                {stat.due > 0 && (
                  <span className="rounded-full bg-gentle/20 px-2 py-0.5 text-xs font-bold text-gentle-foreground">
                    今天該回鍋 {stat.due}
                  </span>
                )}
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              {/* 分段長條：掌握／會了／再練／沒翻 */}
              <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-border">
                <span className="bg-correct" style={{ width: pct(stat.mastered) }} />
                <span className="bg-correct/45" style={{ width: pct(stat.got) }} />
                <span className="bg-gentle" style={{ width: pct(stat.again) }} />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className={cn(stat.mastered > 0 && "text-correct")}>掌握 {stat.mastered}</span>
                <span>會了 {stat.got}</span>
                <span className={cn(stat.again > 0 && "text-gentle-foreground")}>再練 {stat.again}</span>
                <span>還沒翻 {stat.unseen}</span>
                <span className="ml-auto">
                  翻過 {seen}/{stat.total} 張
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
