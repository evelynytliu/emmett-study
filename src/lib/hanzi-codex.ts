import type { HanziSet } from "@/content/hanzi/types";

export const REPAIR_STREAK = 2;
const STORAGE_VERSION = 1;
const RECORDS_KEY = "gz-hanzi-codex:records";

export interface CodexQuestionStat {
  wrongs: number;
  streak: number;
  mastered: boolean;
}

export interface CodexSession {
  version: number;
  setId: string;
  queue: string[];
  stats: Record<string, CodexQuestionStat>;
  firstTry: Record<string, boolean>;
  answerCount: number;
  recognitionOverrides: number;
  startedAt: string;
}

export interface CodexRecord {
  setId: string;
  attempts: number;
  bestFirstTry: number;
  lastFirstTry: number;
  total: number;
  answerCount: number;
  wrongQuestionIds: string[];
  recognitionOverrides: number;
  durationSeconds: number;
  lastFinishedAt: string;
}

export function normalizeZhuyin(value: string): string {
  let normalized = value.replace(/[\sˉ]/g, "");
  if (normalized.includes("˙")) {
    normalized = normalized.replace(/˙/g, "") + "˙";
  }
  return normalized;
}

export function isZhuyinCorrect(given: string, answer: string): boolean {
  return normalizeZhuyin(given) === normalizeZhuyin(answer);
}

function reinsertQuestion(queue: string[], id: string, wrongCount: number): string[] {
  const next = [...queue];
  const gap = Math.min(2 + wrongCount, 4);
  next.splice(Math.min(gap, next.length), 0, id);
  return next;
}

export function freshCodexSession(set: HanziSet): CodexSession {
  return {
    version: STORAGE_VERSION,
    setId: set.id,
    queue: set.questions.map((question) => question.id),
    stats: {},
    firstTry: {},
    answerCount: 0,
    recognitionOverrides: 0,
    startedAt: new Date().toISOString(),
  };
}

export function applyCodexAnswer(
  session: CodexSession,
  questionId: string,
  correct: boolean,
): CodexSession {
  const queue = session.queue[0] === questionId
    ? session.queue.slice(1)
    : session.queue.filter((id, index) => id !== questionId || index !== 0);
  const previous = session.stats[questionId] ?? {
    wrongs: 0,
    streak: 0,
    mastered: false,
  };
  const firstTry = Object.prototype.hasOwnProperty.call(session.firstTry, questionId)
    ? session.firstTry
    : { ...session.firstTry, [questionId]: correct };

  if (correct) {
    const streak = previous.streak + 1;
    const mastered = previous.wrongs === 0 || streak >= REPAIR_STREAK;
    return {
      ...session,
      queue: mastered
        ? queue
        : reinsertQuestion(queue, questionId, previous.wrongs),
      stats: {
        ...session.stats,
        [questionId]: { ...previous, streak, mastered },
      },
      firstTry,
      answerCount: session.answerCount + 1,
    };
  }

  const wrongs = previous.wrongs + 1;
  return {
    ...session,
    queue: reinsertQuestion(queue, questionId, wrongs),
    stats: {
      ...session.stats,
      [questionId]: { wrongs, streak: 0, mastered: false },
    },
    firstTry,
    answerCount: session.answerCount + 1,
  };
}

export function codexSessionSummary(session: CodexSession, total: number) {
  return {
    total,
    mastered: Object.values(session.stats).filter((stat) => stat.mastered).length,
    firstTryCorrect: Object.values(session.firstTry).filter(Boolean).length,
    wrongQuestionIds: Object.entries(session.stats)
      .filter(([, stat]) => stat.wrongs > 0)
      .map(([id]) => id),
    answerCount: session.answerCount,
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 瀏覽器停用儲存時，仍讓孩子完成本次練習。
  }
}

export function codexSessionStorageKey(setId: string): string {
  return `gz-hanzi-codex:session:${setId}`;
}

export function readCodexSession(set: HanziSet): CodexSession | null {
  const saved = readJson<CodexSession | null>(codexSessionStorageKey(set.id), null);
  if (!saved || saved.version !== STORAGE_VERSION || saved.setId !== set.id) return null;
  const ids = new Set(set.questions.map((question) => question.id));
  if (!saved.queue.length || !saved.queue.every((id) => ids.has(id))) return null;
  return saved;
}

export function saveCodexSession(session: CodexSession): void {
  writeJson(codexSessionStorageKey(session.setId), session);
}

export function clearCodexSession(setId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(codexSessionStorageKey(setId));
  } catch {}
}

export function getAllCodexRecords(): Record<string, CodexRecord> {
  return readJson<Record<string, CodexRecord>>(RECORDS_KEY, {});
}

export function saveCodexRecord(record: Omit<CodexRecord, "attempts" | "bestFirstTry">): void {
  const all = getAllCodexRecords();
  const previous = all[record.setId];
  all[record.setId] = {
    ...record,
    attempts: (previous?.attempts ?? 0) + 1,
    bestFirstTry: Math.max(previous?.bestFirstTry ?? 0, record.lastFirstTry),
  };
  writeJson(RECORDS_KEY, all);
}
