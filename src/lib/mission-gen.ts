// src/lib/mission-gen.ts
// 數線闖關「熟練場」的隨機出題。概念關卡是手寫題（content/prep），這裡只負責「練到熟」：
// 每次進關重新出題，每題都自動帶「為什麼」（去括號後的式子＋一句道理）與概念標籤。

import type { MissionChallenge, MissionGenKind } from "@/content/prep/types";

const rand = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const nonZero = (lo: number, hi: number) => {
  let v = 0;
  while (v === 0) v = rand(lo, hi);
  return v;
};
const coin = () => Math.random() < 0.5;

// 負數加括號：(-4)
export const paren = (n: number) => (n < 0 ? `(${n})` : `${n}`);
// 去括號後的寫法：-6 + 8 - 5
export const flat = (terms: number[]) =>
  terms.map((v, i) => (i === 0 ? `${v}` : v >= 0 ? `+ ${v}` : `- ${-v}`)).join(" ");

const SIGN_RULES = {
  "++": { to: "+", concept: "加正數：括號直接拿掉", why: "加一個正數，就是平常的加。" },
  "+-": { to: "-", concept: "加負數＝減（往左走）", why: "加一個負數＝往左走，所以變成減。" },
  "-+": { to: "-", concept: "減正數：就是平常的減", why: "減一個正數，就是平常的減。" },
  "--": { to: "+", concept: "減負數＝加正數", why: "減一個負數＝加它的相反數。想成「取消一筆欠債＝錢變多」。" },
} as const;

// 去括號只看符號：7 - (-4) → 7 + 4
function genSigns(id: string): MissionChallenge {
  const a = nonZero(-9, 9);
  const b = rand(1, 9);
  const op = coin() ? "+" : "-";
  const s = coin() ? "+" : "-";
  const rule = SIGN_RULES[`${op}${s}` as keyof typeof SIGN_RULES];
  const choices = [`${a} + ${b}`, `${a} - ${b}`];
  return {
    id,
    type: "choice",
    layout: "cards",
    prompt: `把括號拿掉，會變成哪一個？\n${paren(a)} ${op} (${s}${b})`,
    choices,
    answerIndex: rule.to === "+" ? 0 : 1,
    why: `${op}(${s}${b}) → ${rule.to} ${b}。${rule.why}`,
    concept: rule.concept,
  };
}

function addWhy(x: number, y: number): string {
  if (x === 0 || y === 0) return "";
  if (x > 0 === y > 0) return "起點和這一步在 0 的同一邊，離 0 越來越遠：絕對值相加、符號不變。";
  return "起點和這一步方向相反，會互相抵消：誰的絕對值大，結果就在誰那一邊。";
}

// 兩數加減：(-3) - (-8)
function genAddSub(id: string): MissionChallenge {
  const a = rand(-12, 12);
  const b = nonZero(-12, 12);
  const minus = coin();
  const move = minus ? -b : b;
  const answer = a + move;
  const expr = `${paren(a)} ${minus ? "-" : "+"} ${paren(b)}`;
  const concept = minus && b < 0 ? "減負數＝加正數" : !minus && b < 0 ? "加負數＝減（往左走）" : a < 0 ? "從負數出發的加減" : "小減大會掉到 0 的左邊";
  return {
    id,
    type: "input",
    prompt: "算出答案。",
    expr,
    answer,
    why: `${expr} = ${flat([a, move])} = ${answer}\n從 ${a} 出發，${move > 0 ? `往右 ${move}` : `往左 ${-move}`} 格。${addWhy(a, move)}`,
    concept,
  };
}

// 三數連算，或括號裡有算式（括號前是減號要全部變號）
function genChain(id: string): MissionChallenge {
  if (coin()) {
    const a = rand(-9, 9);
    const b = nonZero(-9, 9);
    const c = nonZero(-9, 9);
    const m1 = coin();
    const m2 = coin();
    const terms = [a, m1 ? -b : b, m2 ? -c : c];
    const answer = terms.reduce((x, y) => x + y, 0);
    const expr = `${paren(a)} ${m1 ? "-" : "+"} ${paren(b)} ${m2 ? "-" : "+"} ${paren(c)}`;
    return {
      id,
      type: "input",
      prompt: "先把括號都拿掉，再由左到右算。",
      expr,
      answer,
      why: `去括號：${flat(terms)}\n由左到右：${flat(terms.slice(0, 2))} = ${terms[0] + terms[1]}，再 ${terms[2] >= 0 ? `+ ${terms[2]}` : `- ${-terms[2]}`} = ${answer}`,
      concept: "連加減：先全部去括號，再由左到右",
    };
  }
  const a = rand(-9, 9);
  const b = rand(1, 9);
  const c = rand(1, 9);
  const inner = coin(); // true: (b - c)；false: (b + c)
  const minus = Math.random() < 0.75; // 多練括號前是減號的
  const innerTerms = [b, inner ? -c : c];
  const terms = [a, ...innerTerms.map((v) => (minus ? -v : v))];
  const answer = terms.reduce((x, y) => x + y, 0);
  const expr = `${paren(a)} ${minus ? "-" : "+"} (${b} ${inner ? "-" : "+"} ${c})`;
  return {
    id,
    type: "input",
    prompt: "括號裡是一個算式。可以先算括號，也可以去括號——兩種都試試，答案要一樣。",
    expr,
    answer,
    why: minus
      ? `括號前面是減號：拿掉括號時，裡面「每一項」都要變號。\n${expr} = ${flat(terms)} = ${answer}\n最常見的錯是只變第一項、忘了第二項。用「先算括號」檢查：${b} ${inner ? "-" : "+"} ${c} = ${b + innerTerms[1]}，${paren(a)} - ${paren(b + innerTerms[1])} = ${answer}。`
      : `括號前面是加號：括號直接拿掉，裡面不用變號。\n${expr} = ${flat(terms)} = ${answer}`,
    concept: minus ? "括號前是減號：去括號每一項都變號" : "括號前是加號：直接去括號",
  };
}

export function generateMission(kind: MissionGenKind, count: number): MissionChallenge[] {
  const gen = kind === "signs" ? genSigns : kind === "addsub" ? genAddSub : genChain;
  const out: MissionChallenge[] = [];
  const seen = new Set<string>();
  for (let tries = 0; out.length < count && tries < count * 20; tries++) {
    const c = gen(`g${out.length + 1}`);
    const key = c.type === "input" ? (c.expr ?? c.prompt) : c.prompt;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
