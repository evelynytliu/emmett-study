import Link from "next/link";
import { units } from "@/content";
import { wenyanWords } from "@/content/wenyan";
import { homeworks } from "@/content/homework";
import { ArrowLeft, ArrowRight, Archive } from "lucide-react";

// 封存頁：2026 暑假「升國中先修」時期的內容。全部還能用，只是不再放首頁。
// 若哪個先修單元剛好對到學校進度（例如七上第 1 章負數），從科目頁的「先修內容」也找得到。

const groups = [
  {
    title: "數學・五段式概念單元",
    note: "情境 → 引導推導 → 自己解釋 → 變形題 → 口頭回扣。七上第 1～3 章的概念都在這裡。",
    items: units.map((u) => ({ href: `/unit/${u.id}`, title: u.title, sub: u.summary })),
  },
  {
    title: "數學・完整先修課表與螺旋複習",
    note: "暑假的導引式課程與混合複習。要重走一遍隨時可以。",
    items: [
      { href: "/course", title: "完整先修課表", sub: "照順序學 → 間隔複習 → 完成自動診斷吸收度" },
      { href: "/review", title: "螺旋複習", sub: "把學過的概念用新題目混合練一遍" },
    ],
  },
  {
    title: "國文・文言字古今異義",
    note: "五拍推導流程。",
    items: wenyanWords.map((w) => ({ href: `/wenyan/${w.id}`, title: `文言字・${w.word}`, sub: w.teaser })),
  },
  {
    title: "暑假作業引導",
    note: "2026 竹光國中新生暑假作業。已交，留作紀念。",
    items: homeworks.map((h) => ({ href: `/homework/${h.id}`, title: h.title, sub: h.subject })),
  },
];

export default function ArchivePage() {
  return (
    <div className="flex flex-1 flex-col py-8">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        回學習基地
      </Link>
      <header className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">
          <Archive className="h-3.5 w-3.5" />
          封存・2026 暑假先修
        </div>
        <h1 className="text-3xl font-black tracking-tight">升國中先修</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          暑假做過的內容都還在，隨時可以回來重走。開學後的主戰場改到首頁的「接下來要考」與各科基地。
        </p>
      </header>

      <div className="space-y-9">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="text-lg font-bold tracking-tight">{g.title}</h2>
            <p className="mb-3 text-sm text-muted-foreground">{g.note}</p>
            <div className="space-y-2">
              {g.items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="group flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{it.title}</div>
                    <div className="truncate text-sm text-muted-foreground">{it.sub}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
