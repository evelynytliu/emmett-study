// src/lib/handwriting.ts
// 手寫國字辨識——走 Google Input Tools 的手寫辨識端點（免金鑰、瀏覽器直連）。
//
// 跟本專案所有外部依賴同一套原則：辨識失敗（斷網、被擋、回傳異常）一律
// 回傳 null，呼叫端退回「對照答案自評」模式，不能讓孩子卡住。

// 一筆 = [x 座標陣列, y 座標陣列]（單位：canvas 像素）
export type Stroke = [number[], number[]];

// 注意：要用 ime=handwriting 這個端點（回應含 Access-Control-Allow-Origin: *，
// 瀏覽器可直連）；itc=...-handwrit 的版本會回 INVALID_INPUT_METHOD_NAME。
const ENDPOINT =
  "https://www.google.com/inputtools/request?ime=handwriting&app=jhlab&cs=1&oe=UTF-8";

/**
 * 把手寫筆跡送去辨識，回傳候選字陣列（信心度由高到低）。
 * 失敗回傳 null（呼叫端據此退回自評模式）。
 */
export async function recognizeHandwriting(
  strokes: Stroke[],
  width: number,
  height: number,
): Promise<string[] | null> {
  if (strokes.length === 0) return null;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        options: "enable_pre_space",
        requests: [
          {
            writing_guide: {
              writing_area_width: width,
              writing_area_height: height,
            },
            pre_context: "",
            max_num_results: 8,
            max_completions: 0,
            language: "zh_TW",
            ink: strokes,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    // 回應格式：["SUCCESS", [[requestId, [候選字...], ...]]]
    if (!Array.isArray(data) || data[0] !== "SUCCESS") return null;
    const candidates = data[1]?.[0]?.[1];
    if (!Array.isArray(candidates)) return null;
    return candidates.filter((c): c is string => typeof c === "string");
  } catch {
    return null;
  }
}
