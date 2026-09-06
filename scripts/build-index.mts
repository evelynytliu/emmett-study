// scripts/build-index.mts
// 產生 docs/CONTENT-INDEX.md：整站內容的一頁索引（科目 → 章節 → 內容），
// 讓新的 Claude Code session 不用翻整個 repo 就知道「已經有什麼、缺什麼」。
// 每次加內容後跑 `npm run index`（`npm run check` 會一起跑）。只讀資料、只寫這一個檔。

import { writeFileSync } from "node:fs";
import { subjects } from "../src/content/subjects";
import { quizzes } from "../src/content/quizzes";
import { preps } from "../src/content/prep";
import { exams } from "../src/content/exams";
import { units } from "../src/content";
import { wenyanWords } from "../src/content/wenyan";
import { homeworks } from "../src/content/homework";
import { historyScenes } from "../src/content/history";
import { hanziSets } from "../src/content/hanzi";
import { school, roadmap } from "../src/content/school";

const lines: string[] = [];
const L = (s = "") => lines.push(s);

L("# 內容索引（自動產生，勿手改）");
L();
L(`> 由 \`npm run index\` 從 \`src/content/**\` 產生。學生：${school.student}；目前學期：${school.currentSemester}；目標：${school.target.school}（${school.target.exam} ${school.target.date}${school.target.estimated ? "，預估" : ""}）。`);
L();

L("## 考試排程（exams.ts）");
L();
if (exams.length === 0) L("_尚無_");
for (const e of [...exams].sort((a, b) => a.date.localeCompare(b.date))) {
  const r = e.result;
  const res = r ? `｜結果：${r.score !== undefined ? `${r.score}/${r.total ?? 100}` : (r.grade ?? "—")}${r.weak?.length ? `，錯：${r.weak.join("、")}` : ""}${r.mistakesQuizId ? `，錯題回鍋 ${r.mistakesQuizId}` : ""}` : "";
  L(`- ${e.date} ${e.subject} ${e.kind}「${e.name}」${e.scope ? `（${e.scope}）` : ""} → ${e.links.map((l) => l.href).join(", ") || "無連結"}${res}`);
}
L();

L("## 各科內容");
L();
for (const s of subjects) {
  const ps = preps.filter((p) => p.subjectId === s.id);
  const qs = quizzes.filter((q) => q.subjectId === s.id);
  L(`### ${s.name}（${s.publisher}版）`);
  L();
  L(`考前複習頁 ${ps.length}・題組 ${qs.length}`);
  L();
  for (const t of s.topics) {
    const tp = ps.filter((p) => p.topicId === t.id);
    const tq = qs.filter((q) => q.topicId === t.id);
    const has = tp.length + tq.length > 0;
    L(`- ${has ? "✅" : "▫️"} \`${t.id}\` ${t.semester} ${t.title}`);
    for (const p of tp) {
      const cards = p.sections.reduce((n, x) => n + (x.kind === "flashcards" ? x.cards.length : 0), 0);
      L(`  - 複習頁 \`${p.id}\`「${p.title}」${cards ? `${cards} 張卡` : ""}${p.source ? `・${p.source}` : ""}`);
    }
    for (const q of tq) L(`  - 題組 \`${q.id}\`「${q.title}」${q.questions.length} 題`);
  }
  const loose = [...ps.filter((p) => !p.topicId), ...qs.filter((q) => !q.topicId)];
  for (const x of loose) L(`- （未掛章節）\`${x.id}\`「${x.title}」`);
  L();
}

L("## 常駐模組");
L();
L(`- 形音義題庫 \`/hanzi\`：${hanziSets.length} 批、${hanziSets.reduce((n, s) => n + s.questions.length, 0)} 字`);
L(`- 歷史 3D 場景 \`/history\`：${historyScenes.length} 個場景`);
L();

L("## 封存（2026 暑假先修，/archive）");
L();
L(`- 數學五段式單元 ${units.length} 個：${units.map((u) => `\`${u.id}\` ${u.title}`).join("、")}`);
L(`- 文言字 ${wenyanWords.length} 個：${wenyanWords.map((w) => w.word).join("、")}`);
L(`- 暑假作業 ${homeworks.length} 份`);
L();

L("## 三年路線（school.ts）");
L();
for (const r of roadmap) L(`- ${r.semester === school.currentSemester ? "**" : ""}${r.semester}${r.semester === school.currentSemester ? "（現在）**" : ""} ${r.from}：${r.focus}`);
L();

writeFileSync("docs/CONTENT-INDEX.md", lines.join("\n"), "utf8");
console.log(`✅ docs/CONTENT-INDEX.md 已更新（${preps.length} 複習頁、${quizzes.length} 題組、${exams.length} 場考試）`);
