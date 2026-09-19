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
// 上標指數：sup(3) → "³"、sup(-4) → "⁻⁴"
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
export const sup = (n: number) => `${n < 0 ? "⁻" : ""}${String(Math.abs(n)).split("").map((d) => SUP[Number(d)]).join("")}`;
// 把算式步驟用 = 串起來，連續重複的步驟只留一個（例「5 + 3 = 5 + 3 = 8」→「5 + 3 = 8」）
const steps = (...parts: (string | number)[]) =>
  parts.map(String).filter((x, i, arr) => i === 0 || x !== arr[i - 1]).join(" = ");
// ±2～±9（避開 ±1，題目才有練習價值）
const nonUnit = (lo: number, hi: number) => {
  let v = 1;
  while (Math.abs(v) < 2) v = rand(lo, hi);
  return v;
};

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
    why: `${steps(expr, flat([a, move]), answer)}\n從 ${a} 出發，${move > 0 ? `往右 ${move}` : `往左 ${-move}`} 格。${addWhy(a, move)}`,
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

// 符號雷達：幾個數相乘，只判斷正／負／0（偶數個負號＝正、奇數個＝負、有 0 就是 0）
function genMulSign(id: string): MissionChallenge {
  const k = rand(2, 4);
  const factors = Array.from({ length: k }, () => nonUnit(-9, 9));
  if (Math.random() < 0.12) factors[rand(0, k - 1)] = 0;
  const negs = factors.filter((f) => f < 0).length;
  const hasZero = factors.includes(0);
  const answer = hasZero ? 2 : negs % 2 === 0 ? 0 : 1;
  return {
    id,
    type: "choice",
    layout: "cards",
    prompt: `不用算出來——結果是正的、負的、還是 0？\n${factors.map(paren).join(" × ")}`,
    choices: ["正", "負", "0"],
    answerIndex: answer,
    why: hasZero
      ? "裡面有一個 0，不管其他是什麼，乘起來一定是 0。"
      : `數負號：有 ${negs} 個負號，${negs % 2 === 0 ? "偶數個→正" : "奇數個→負"}。每兩個負號互相抵消成正，剩下的決定正負。`,
    concept: hasZero ? "有 0 相乘結果是 0" : "數負號：偶數個正、奇數個負",
  };
}

// 乘除快算：兩數乘或除（除法保證整除）
function genMulDiv(id: string): MissionChallenge {
  const mul = coin();
  const b = nonUnit(-9, 9);
  const q = nonUnit(-9, 9);
  const a = mul ? b : b * q; // 除法：a = b × q
  const expr = mul ? `${paren(a)} × ${paren(q)}` : `${paren(a)} ÷ ${paren(b)}`;
  const answer = mul ? a * q : q;
  const x = mul ? a : a;
  const y = mul ? q : b;
  const sameSign = x > 0 === y > 0;
  return {
    id,
    type: "input",
    prompt: "先決定正負，再算數字。",
    expr,
    answer,
    why: `先看符號：${sameSign ? "同號→正" : "異號→負"}。再算數字：${Math.abs(x)} ${mul ? "×" : "÷"} ${Math.abs(y)} = ${Math.abs(answer)}。所以 ${expr} = ${answer}。`,
    concept: sameSign ? (x < 0 ? "負×負／負÷負＝正" : "正×正＝正") : "異號相乘除＝負",
  };
}

// 四則混合：先乘除後加減、括號、平方（含 -a² 與 (-a)² 的差別）
function genMixed(id: string): MissionChallenge {
  const pattern = rand(1, 5);
  const a = nonZero(-9, 9);
  const b = nonZero(-9, 9);
  const c = nonZero(-9, 9);
  if (pattern === 1) {
    // a + b × c
    const bc = b * c;
    return { id, type: "input", prompt: "先乘除，後加減。", expr: `${paren(a)} + ${paren(b)} × ${paren(c)}`, answer: a + bc,
      why: `先算乘法：${paren(b)} × ${paren(c)} = ${bc}。再加：${a} + ${paren(bc)} = ${a + bc}。`, concept: "先乘除後加減" };
  }
  if (pattern === 2) {
    // a − b × c
    const bc = b * c;
    return { id, type: "input", prompt: "先乘除，後加減；減負數要小心。", expr: `${paren(a)} - ${paren(b)} × ${paren(c)}`, answer: a - bc,
      why: `先算乘法：${paren(b)} × ${paren(c)} = ${bc}。再減：${steps(`${a} - ${paren(bc)}`, flat([a, -bc]), a - bc)}。`, concept: "先乘除後加減；減負數＝加正數" };
  }
  if (pattern === 3) {
    // (−a)² 或 −a² 再加 b
    const base = rand(2, 9);
    const withParen = coin();
    const sq = withParen ? base * base : -(base * base);
    const expr = withParen ? `(-${base})² + ${paren(b)}` : `-${base}² + ${paren(b)}`;
    return { id, type: "input", prompt: "括號在不在，差很多。", expr, answer: sq + b,
      why: withParen
        ? `(-${base})² = (-${base}) × (-${base}) = ${sq}（負號一起平方）。再加：${sq} + ${paren(b)} = ${sq + b}。`
        : `-${base}² 沒有括號，是「${base}² 的相反數」= -${base * base}。再加：${sq} + ${paren(b)} = ${sq + b}。`,
      concept: withParen ? "(-a)²：負號一起平方，結果是正" : "-a²：先平方再加負號，結果是負" };
  }
  if (pattern === 4) {
    // a ÷ b + c，保證整除
    const d = nonZero(-9, 9);
    const num = d * b;
    return { id, type: "input", prompt: "先乘除，後加減。", expr: `${paren(num)} ÷ ${paren(b)} + ${paren(c)}`, answer: d + c,
      why: `先算除法：${paren(num)} ÷ ${paren(b)} = ${d}。再加：${d} + ${paren(c)} = ${d + c}。`, concept: "先乘除後加減" };
  }
  // a × b − c × d：兩個乘法各自算完再減
  const d = nonZero(-9, 9);
  const ab = a * b;
  const cd = c * d;
  return { id, type: "input", prompt: "兩個乘法各自先算完，再相減。", expr: `${paren(a)} × ${paren(b)} - ${paren(c)} × ${paren(d)}`, answer: ab - cd,
    why: `${paren(a)} × ${paren(b)} = ${ab}，${paren(c)} × ${paren(d)} = ${cd}。再減：${steps(`${ab} - ${paren(cd)}`, flat([ab, -cd]), ab - cd)}。`, concept: "先乘除後加減；減負數＝加正數" };
}

export function generateMission(kind: MissionGenKind, count: number): MissionChallenge[] {
  const gens = { signs: genSigns, addsub: genAddSub, chain: genChain, mulsign: genMulSign, muldiv: genMulDiv, mixed: genMixed } as const;
  const gen = gens[kind];
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
