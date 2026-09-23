// src/app/api/mission-review/route.ts
// 家長頁「AI 分析闖關」：把各關的「一次就對／卡住的概念／秒數」送給 Gemini，
// 回一份給媽媽看的分析：哪些概念站穩、哪些還沒遷移（附證據）、下一步怎麼陪。
//
// 跟 /api/diagnose 同一套：Gemini 當純分析引擎、只回 JSON；任何錯誤一律 try/catch
// → fallbackToStatic=true，前端退回 heuristicMissionReview（純規則）。
// 只有家長頁按一次才呼叫一次，不會每題都打 AI（額度）。

import { NextResponse } from "next/server";
import { corsJson, corsPreflight } from "@/lib/ai-cors";
import { callGemini } from "@/lib/gemini";
import type { MissionReview, MissionReviewRequest, MissionReviewResponse } from "@/lib/mission-review";

const isStaticExport = process.env.BUILD_TARGET === "pages";

export const runtime = "nodejs";
export const dynamic = isStaticExport ? "force-static" : "force-dynamic";

const SYSTEM_PROMPT = `你是一位懂國中數學教學、也懂孩子的家教，正在幫一位媽媽解讀她七年級兒子在「數線闖關」遊戲裡的紀錄。

這個遊戲的設計：一關一個概念，每題先自己作答再看「為什麼」；答錯的題同一關會再回來；「一次就對」是指第一次作答就對的題數。「熟練場」是隨機出題、記秒數的練速度關卡。「卡住的概念」是他最近一次玩那一關時答錯的題目所對應的概念標籤。

這個孩子的狀況：數學基礎不穩，習慣背規則、套口訣（例如把「負負得正」到處套）。教學目標是「理解」不是「背」：加減用數線走路、乘負數是反方向走、去括號要知道為什麼。

你的任務：只根據紀錄講得出的話，不要編造。關卡名稱、概念標籤都要「照紀錄原文」引用，不可以改寫、不可以推測紀錄裡沒出現的概念（例如紀錄沒提到絕對值，就不要講絕對值）。
- summary：兩三句整體狀況，講給媽媽聽，不要空泛的鼓勵。
- stable：從「全部一次就對」的關卡判斷哪些概念已經站穩（用孩子聽得懂的說法）。
- weak：還沒遷移的概念，每一項要有 evidence（紀錄裡的證據：哪一關、幾分之幾、卡在什麼）和 action（媽媽可以怎麼做：讓他再玩哪一關、問他什麼問題、用什麼生活例子）。最多 4 項，按重要性排。如果一個概念是後面關卡的地基（例如「減負數＝加正數」是去括號的地基），要點出來。
- next_step：明確的下一步：先玩哪一關、目標是什麼。
- parent_tip：一句給媽媽的提醒：怎麼問、別說什麼（不要說「你笨」「這麼簡單」；錯了是「概念還沒遷移」）。

你必須只輸出一個 JSON 物件，不要有任何其他文字、不要用 markdown 程式碼框。格式：
{
  "summary": "…",
  "stable": ["…", "…"],
  "weak": [{ "concept": "…", "evidence": "…", "action": "…" }],
  "next_step": "…",
  "parent_tip": "…"
}
全部用繁體中文（台灣用語），語氣是有經驗的家教在跟家長講話：具體、平實、不說教。`;

function buildUserPrompt(req: MissionReviewRequest): string {
  const lines = req.levels.map((l) => {
    const parts = [
      `【${l.prepTitle}】${l.levelTitle}${l.drill ? "（熟練場）" : ""}`,
      `這關在練：${l.goal}`,
      `最佳一次就對 ${l.best}/${l.total}`,
      l.lastFirstTry !== null ? `最近一次 ${l.lastFirstTry}/${l.total}` : "",
      `玩過 ${l.plays} 次`,
      l.bestSec !== null ? `全對最快 ${l.bestSec} 秒` : "",
      l.missed.length > 0 ? `最近一次卡住的概念：${l.missed.join("；")}` : "最近一次沒有卡住的概念",
    ].filter(Boolean);
    return parts.join("｜");
  });
  return `【已玩過的關卡】
${lines.join("\n")}

【還沒解鎖或還沒玩的關卡】
${req.lockedLevels.length > 0 ? req.lockedLevels.join("、") : "（全部都玩過了）"}

請依系統指示，只輸出那個 JSON 物件。`;
}

function parseReview(raw: string): MissionReview | null {
  if (!raw) return null;
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    const str = (v: unknown) => String(v ?? "").trim();
    const arr = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
    const weak = Array.isArray(obj.weak)
      ? obj.weak
          .map((w: Record<string, unknown>) => ({ concept: str(w?.concept), evidence: str(w?.evidence), action: str(w?.action) }))
          .filter((w: { concept: string }) => w.concept)
          .slice(0, 4)
      : [];
    const summary = str(obj.summary);
    if (!summary) return null;
    return {
      summary,
      stable: arr(obj.stable).slice(0, 6),
      weak,
      next_step: str(obj.next_step),
      parent_tip: str(obj.parent_tip),
    };
  } catch {
    return null;
  }
}

async function handle(request: Request): Promise<NextResponse<MissionReviewResponse>> {
  let body: MissionReviewRequest;
  try {
    body = (await request.json()) as MissionReviewRequest;
    if (!Array.isArray(body.levels)) throw new Error("bad body");
  } catch {
    return corsJson({ ok: false, review: null, fallbackToStatic: true, error: "invalid request body" });
  }
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 30_000);
  try {
    const text = await callGemini({ system: SYSTEM_PROMPT, user: buildUserPrompt(body), signal: abortController.signal });
    const review = parseReview(text);
    if (!review) return corsJson({ ok: false, review: null, fallbackToStatic: true, error: "could not parse AI output" });
    return corsJson({ ok: true, review, fallbackToStatic: false });
  } catch (err) {
    return corsJson({ ok: false, review: null, fallbackToStatic: true, error: err instanceof Error ? err.message : "AI unavailable" });
  } finally {
    clearTimeout(timeout);
  }
}

export const POST = isStaticExport ? undefined : handle;
export const OPTIONS = isStaticExport ? undefined : corsPreflight;
