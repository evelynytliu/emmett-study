// src/lib/gemini.ts
// 伺服器端：呼叫 Gemini REST API 當「純分析引擎」（單回合、要求回 JSON）。
//
// 認證走免費的 Gemini API 金鑰（GEMINI_API_KEY，從 Google AI Studio 申請）。
// 因為只是一支 API 金鑰、不是本機訂閱認證，所以這份程式可以部署到雲端，
// 孩子在阿嬤家用 iPad 也連得到，家裡不用開著電腦。
//
// 跟 explain / coach / diagnose 三個 route 的設計一致：這裡任何錯誤都直接 throw，
// 由各 route 的 try/catch 接住 → 回傳 fallbackToStatic=true，前端退回靜態模式，
// 孩子永遠不會卡住（沒金鑰、額度用盡、逾時、回傳格式怪，都會安全退回）。

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";

// 預設用免費的 gemini-2.5-flash（穩定、額度寬）。想要更聰明、一樣免費，
// 可在 .env.local 設 GEMINI_MODEL=gemini-3-flash。免費版 Flash 系列每天約 1,500 次，
// 對一個孩子綽綽有餘。（2.5 Pro / 3 Pro 目前要付費，別填那兩個。）
const DEFAULT_MODEL = "gemini-2.5-flash";
export function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

export interface GeminiCall {
  // 給 Gemini 的系統指示（各 route 既有的 SYSTEM_PROMPT 直接沿用）
  system: string;
  // 這一回合的使用者輸入（各 route 既有的 buildUserPrompt 結果）
  user: string;
  // 逾時用：把 route 的 AbortController.signal 傳進來
  signal?: AbortSignal;
  // 選填：覆寫模型（不填用 geminiModel()）
  model?: string;
}

// 送一段 system + user 給 Gemini，要求只回 JSON 字串。
// 成功回傳模型輸出的文字（理應是 JSON，由各 route 自己的 parse 函式解析）。
// 任何失敗一律 throw（讓 route 的 catch 退回靜態）。
export async function callGemini({
  system,
  user,
  signal,
  model,
}: GeminiCall): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "缺少 GEMINI_API_KEY：請在 .env.local 填入你的 Gemini 免費 API 金鑰（Google AI Studio 申請）。",
    );
  }

  const m = model || geminiModel();
  try {
    return await callModel(m, apiKey, system, user, signal);
  } catch (err) {
    // 設定的模型名稱不存在（例如 GEMINI_MODEL 填了還沒開放的版本）→ 自動改用預設模型再試一次，
    // 不然線上所有 AI 功能會因為一個環境變數全部退回靜態。
    const notFound = err instanceof Error && /HTTP 404/.test(err.message);
    if (!notFound || m === DEFAULT_MODEL) throw err;
    console.warn(`[gemini] 模型 ${m} 不存在，改用 ${DEFAULT_MODEL}`);
    return callModel(DEFAULT_MODEL, apiKey, system, user, signal);
  }
}

async function callModel(
  m: string,
  apiKey: string,
  system: string,
  user: string,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${GEMINI_ENDPOINT}/${m}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        // 直接要 JSON 物件，不會包 markdown 程式碼框（各 route 的 parser 仍會容錯）。
        responseMimeType: "application/json",
        // 給足空間：2.5 Flash 預設會「思考」，思考 token 也算在輸出額度裡。
        // 留 8192 讓「思考（有時上千 token）+ 那個小 JSON」都裝得下，不會被截斷。
        // 免費版輸出不另計費，放寬無妨；不寫版本相關的 thinkingConfig 以相容 2.5 / 3.x。
        maxOutputTokens: 8192,
      },
    }),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // 429 = 撞到免費額度上限；401/403 = 金鑰問題。都丟出去 → route 退回靜態。
    throw new Error(`Gemini HTTP ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((p) => p?.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini 回傳空內容");
  return text;
}
