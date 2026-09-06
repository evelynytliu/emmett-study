// scripts/validate-content.mts
// 內容驗證腳本——出完題/教材後跑 `npm run validate`，在上線前抓出結構錯誤。
//
// 為什麼需要它：內容後台就是「用 Claude Code 出題、寫進 .ts 檔」。
// 型別（tsc）能抓欄位型別錯，但抓不到「語意錯誤」：選項索引超出範圍、
// id 撞號、題組掛到不存在的科目/章節、答案不在選項裡……這支腳本補這一塊。
//
// 只讀資料、不改檔；有錯回傳非 0（CI / 手動都好用）。

import { subjects } from "../src/content/subjects";
import { quizzes } from "../src/content/quizzes";
import { units } from "../src/content";
import { wenyanWords } from "../src/content/wenyan";
import { homeworks } from "../src/content/homework";
import { historyScenes } from "../src/content/history";
import { hanziSets } from "../src/content/hanzi";
import { preps } from "../src/content/prep";
import { PREP_FIGURES } from "../src/content/prep/types";
import { exams } from "../src/content/exams";

let errors = 0;
let warnings = 0;

function err(msg: string) {
  console.error(`  ❌ ${msg}`);
  errors++;
}
function warn(msg: string) {
  console.warn(`  ⚠️  ${msg}`);
  warnings++;
}
function ok(msg: string) {
  console.log(`  ✅ ${msg}`);
}

const subjectIds = new Set(subjects.map((s) => s.id));
const topicIds = new Set(subjects.flatMap((s) => s.topics.map((t) => t.id)));

// ── 科目 ──
console.log("\n📚 科目 subjects.ts");
{
  const seen = new Set<string>();
  for (const s of subjects) {
    if (seen.has(s.id)) err(`科目 id 重複：${s.id}`);
    seen.add(s.id);
    const tseen = new Set<string>();
    for (const t of s.topics) {
      if (tseen.has(t.id)) err(`${s.name} 章節 id 重複：${t.id}`);
      tseen.add(t.id);
    }
  }
  ok(`${subjects.length} 科、${topicIds.size} 個章節，id 無重複`);
}

// ── 線上題組 ──
console.log("\n📝 線上題組 quizzes/");
{
  const seen = new Set<string>();
  for (const q of quizzes) {
    const tag = `[${q.id}]`;
    if (seen.has(q.id)) err(`${tag} 題組 id 重複`);
    seen.add(q.id);
    if (!subjectIds.has(q.subjectId))
      err(`${tag} subjectId 不存在：${q.subjectId}`);
    if (q.topicId && !topicIds.has(q.topicId))
      warn(`${tag} topicId 不在章節地圖：${q.topicId}（題目仍可用，但科目頁不會點亮章節）`);
    if (q.questions.length === 0) err(`${tag} 沒有任何題目`);

    const qseen = new Set<string>();
    for (const item of q.questions) {
      const qt = `${tag} 題 ${item.id}`;
      if (qseen.has(item.id)) err(`${qt} 題目 id 在組內重複`);
      qseen.add(item.id);
      if (!item.explanation?.trim()) err(`${qt} 缺詳解 explanation`);
      if (!item.concept?.trim()) err(`${qt} 缺概念標籤 concept`);

      if (item.type === "choice") {
        if (!item.choices || item.choices.length < 2)
          err(`${qt} 選擇題至少要 2 個選項`);
        if (
          item.answerIndex === undefined ||
          item.answerIndex < 0 ||
          item.answerIndex >= (item.choices?.length ?? 0)
        )
          err(`${qt} answerIndex 超出選項範圍`);
      } else if (item.type === "text") {
        if (!item.answerText || item.answerText.length === 0)
          err(`${qt} 填空題缺 answerText`);
      }
    }
  }
  if (errors === 0) ok(`${quizzes.length} 組題目、共 ${quizzes.reduce((n, q) => n + q.questions.length, 0)} 題，結構正確`);
}

// ── 國文形音義 ──
console.log("\n✍️ 形音義 hanzi/");
{
  const ZHUYIN_RE = /^[ㄅ-ㄩ]+[ˊˇˋ˙]?$|^˙[ㄅ-ㄩ]+$/;
  const seen = new Set<string>();
  const orders = new Set<number>();
  for (const s of hanziSets) {
    const tag = `[${s.id}]`;
    if (seen.has(s.id)) err(`${tag} 題組 id 重複`);
    seen.add(s.id);
    if (orders.has(s.order)) warn(`${tag} order 重複：${s.order}`);
    orders.add(s.order);
    if (s.questions.length === 0) err(`${tag} 沒有任何題目`);

    const qseen = new Set<string>();
    for (const q of s.questions) {
      const qt = `${tag} 題 ${q.id}`;
      if (qseen.has(q.id)) err(`${qt} 題目 id 在組內重複`);
      qseen.add(q.id);
      const marks = q.sentence.match(/【.+?】/g) ?? [];
      if (marks.length !== 1)
        err(`${qt} 題幹必須恰好有一個【目標】標記（目前 ${marks.length} 個）`);
      if (!q.explanation?.trim()) err(`${qt} 缺詳解 explanation`);
      if (!q.concept?.trim()) err(`${qt} 缺考點標籤 concept`);
      if (q.kind === "zhuyin") {
        if (!ZHUYIN_RE.test(q.answer))
          err(`${qt} 注音答案格式不對：「${q.answer}」（只能是注音符號＋調號）`);
        const target = marks[0]?.slice(1, -1) ?? "";
        if (/[ㄅ-ㄩ]/.test(target))
          err(`${qt} 注音題的【目標】應該是國字，卻是注音：${target}`);
      } else if (q.kind === "char") {
        if (!/^[㐀-鿿]$/.test(q.answer))
          err(`${qt} 國字答案必須是單一個國字：「${q.answer}」`);
        const target = marks[0]?.slice(1, -1) ?? "";
        if (!/^[ㄅ-ㄩˊˇˋ˙]+$/.test(target))
          err(`${qt} 國字題的【目標】應該是注音，卻是：${target}`);
      }
    }
  }
  if (errors === 0)
    ok(
      `${hanziSets.length} 天、共 ${hanziSets.reduce((n, s) => n + s.questions.length, 0)} 個字，結構正確`,
    );
}

// ── 數學單元 ──
console.log("\n🧮 數學單元 units/");
{
  const seen = new Set<string>();
  const orders = new Set<number>();
  for (const u of units) {
    if (seen.has(u.id)) err(`單元 id 重複：${u.id}`);
    seen.add(u.id);
    if (orders.has(u.order)) warn(`單元 order 重複：${u.order}（${u.title}）`);
    orders.add(u.order);
    if (u.checkMode !== "static" && u.checkMode !== "ai")
      err(`${u.id} checkMode 只能是 static / ai`);
    if (u.section4_variants.questions.length < 3)
      warn(`${u.id} 變形題少於 3 題（規格建議 3 題：1 題像教材、2 題換外觀）`);
  }
  ok(`${units.length} 個單元`);
}

// ── 文言字 ──
console.log("\n📜 文言字 wenyan/");
{
  const seen = new Set<string>();
  for (const w of wenyanWords) {
    if (seen.has(w.id)) err(`文言字 id 重複：${w.id}`);
    seen.add(w.id);
    if (w.variants.length === 0) err(`${w.id} 沒有變形題句`);
  }
  ok(`${wenyanWords.length} 個字`);
}

// ── 暑假作業 ──
console.log("\n📄 暑假作業 homework/");
{
  const seen = new Set<string>();
  for (const h of homeworks) {
    if (seen.has(h.id)) err(`作業 id 重複：${h.id}`);
    seen.add(h.id);
  }
  ok(`${homeworks.length} 份作業`);
}

// ── 歷史 3D 場景 ──
console.log("\n🏛️ 歷史 3D 場景 history/");
{
  const seen = new Set<string>();
  for (const s of historyScenes) {
    const tag = `[${s.id}]`;
    if (seen.has(s.id)) err(`${tag} 場景 id 重複`);
    seen.add(s.id);
    if (s.stages.length === 0) err(`${tag} 沒有任何幕`);
    const tseen = new Set<string>();
    for (const st of s.stages) {
      for (const t of st.terms) {
        if (tseen.has(t.id)) err(`${tag} 名詞卡 id 重複：${t.id}`);
        tseen.add(t.id);
        if (!t.explain?.trim()) err(`${tag} 名詞卡 ${t.id} 缺解釋 explain`);
        if (!t.hook?.trim()) err(`${tag} 名詞卡 ${t.id} 缺記憶鉤 hook`);
      }
    }
    if (s.quiz.length === 0) err(`${tag} 沒有快問快答題目`);
    for (const [i, q] of s.quiz.entries()) {
      if (q.answer < 0 || q.answer >= q.options.length)
        err(`${tag} 快問快答第 ${i + 1} 題 answer 超出選項範圍`);
      if (!q.explain?.trim()) err(`${tag} 快問快答第 ${i + 1} 題缺詳解`);
    }
  }
  ok(
    `${historyScenes.length} 個場景、共 ${historyScenes.reduce(
      (n, s) => n + s.stages.reduce((m, st) => m + st.terms.length, 0),
      0,
    )} 張名詞卡`,
  );
}


// ── 考前複習頁 ──
console.log("\n🗂️ 考前複習頁 prep/");
{
  const seen = new Set<string>();
  const quizIds = new Set(quizzes.map((q) => q.id));
  for (const p of preps) {
    const tag = `[${p.id}]`;
    if (seen.has(p.id)) err(`${tag} 複習頁 id 重複`);
    seen.add(p.id);
    if (!p.id.startsWith("prep-")) warn(`${tag} id 建議以 prep- 開頭`);
    if (!subjectIds.has(p.subjectId)) err(`${tag} subjectId 不存在：${p.subjectId}`);
    if (p.topicId && !topicIds.has(p.topicId))
      warn(`${tag} topicId 不在章節地圖：${p.topicId}`);
    if (p.sections.length === 0) err(`${tag} 沒有任何區塊`);
    const cardIds = new Set<string>();
    for (const [si, s] of p.sections.entries()) {
      const st = `${tag} 區塊 ${si + 1}（${s.kind}）`;
      if (s.kind === "flashcards") {
        if (s.cards.length === 0) err(`${st} 沒有卡片`);
        for (const c of s.cards) {
          if (cardIds.has(c.id)) err(`${st} 卡片 id 重複：${c.id}（整頁內要唯一）`);
          cardIds.add(c.id);
          if (!c.front?.trim() || !c.back?.trim()) err(`${st} 卡片 ${c.id} 正面或背面是空的`);
        }
      } else if (s.kind === "keypoints") {
        if (s.items.length === 0) err(`${st} 沒有重點`);
        for (const t of s.items)
          if ((t.match(/【/g) ?? []).length !== (t.match(/】/g) ?? []).length)
            err(`${st} 挖空括號不成對：${t}`);
      } else if (s.kind === "compare") {
        if (s.rows.length === 0) err(`${st} 沒有列`);
      } else if (s.kind === "quiz") {
        if (!quizIds.has(s.quizId)) err(`${st} 找不到題組：${s.quizId}`);
      } else if (s.kind === "diagram") {
        if (!PREP_FIGURES.includes(s.figure)) err(`${st} 示意圖不存在：${s.figure}`);
        if (s.hotspots.length < 2) err(`${st} 熱點太少`);
        const hs = new Set<string>();
        for (const h of s.hotspots) {
          if (hs.has(h.id)) err(`${st} 熱點 id 重複：${h.id}`);
          hs.add(h.id);
          if (!h.name?.trim()) err(`${st} 熱點 ${h.id} 沒有名稱`);
          if (h.x < 0 || h.x > 200 || h.y < 0 || h.y > 260)
            err(`${st} 熱點 ${h.id} 座標超出 viewBox 200×260：(${h.x}, ${h.y})`);
        }
      }
    }
  }
  ok(`${preps.length} 頁複習頁`);
}

// ── 考試排程 ──
console.log("\n📅 考試排程 exams.ts");
{
  const seen = new Set<string>();
  const prepIds = new Set(preps.map((p) => p.id));
  const quizIds = new Set(quizzes.map((q) => q.id));
  for (const e of exams) {
    const tag = `[${e.id}]`;
    if (seen.has(e.id)) err(`${tag} 考試 id 重複`);
    seen.add(e.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) err(`${tag} 日期格式要 YYYY-MM-DD：${e.date}`);
    if (e.subject !== "全科" && !subjectIds.has(e.subject))
      err(`${tag} subject 不存在：${e.subject}`);
    for (const l of e.links) {
      const m = l.href.match(/^\/(prep|quiz)\/(.+)$/);
      if (m) {
        const set = m[1] === "prep" ? prepIds : quizIds;
        if (!set.has(m[2])) err(`${tag} 連結指到不存在的內容：${l.href}`);
      }
    }
    if (e.result) {
      const r = e.result;
      const total = r.total ?? 100;
      if (r.score !== undefined && (r.score < 0 || r.score > total))
        err(`${tag} 分數 ${r.score} 超出滿分 ${total}`);
      if (r.mistakesQuizId && !quizIds.has(r.mistakesQuizId))
        err(`${tag} 錯題題組不存在：${r.mistakesQuizId}`);
      if (r.score === undefined && !r.grade && !r.note)
        warn(`${tag} result 沒有分數、等第或備註`);
    }
  }
  const withResult = exams.filter((e) => e.result).length;
  ok(`${exams.length} 場考試（${withResult} 場已登記成績）`);
}

// ── 總結 ──
console.log("\n" + "─".repeat(40));
if (errors === 0) {
  console.log(`✅ 全部通過${warnings > 0 ? `（${warnings} 個提醒）` : ""}，可以上線。`);
  process.exit(0);
} else {
  console.error(`❌ 有 ${errors} 個錯誤${warnings > 0 ? `、${warnings} 個提醒` : ""}，請修正後再上線。`);
  process.exit(1);
}
