"use client";

import * as React from "react";
import Link from "next/link";
import type { HanziQuestion, HanziSet } from "@/content/hanzi/types";
import { recognizeHandwriting, type Stroke } from "@/lib/handwriting";
import {
  applyCodexAnswer,
  clearCodexSession,
  codexSessionSummary,
  freshCodexSession,
  getAllCodexRecords,
  isZhuyinCorrect,
  readCodexSession,
  saveCodexRecord,
  saveCodexSession,
  type CodexQuestionStat,
  type CodexRecord,
  type CodexSession,
} from "@/lib/hanzi-codex";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  CircleHelp,
  Eraser,
  Flame,
  RotateCcw,
  Sparkles,
  Target,
  Undo2,
  X,
} from "lucide-react";

const PAD_SIZE = 300;
const ZHUYIN_ROWS = [
  "ㄅㄆㄇㄈㄉㄊㄋㄌ",
  "ㄍㄎㄏㄐㄑㄒ",
  "ㄓㄔㄕㄖㄗㄘㄙ",
  "ㄧㄨㄩㄚㄛㄜㄝ",
  "ㄞㄟㄠㄡㄢㄣㄤㄥㄦ",
];
const TONES = ["ˊ", "ˇ", "ˋ", "˙"];

type Feedback = {
  correct: boolean;
  unsure?: boolean;
  candidates?: string[];
  recognized?: boolean;
  selfJudged?: boolean;
};

type Phase = "answering" | "feedback" | "selfjudge" | "done";

export function HanziCodexLab({ sets }: { sets: HanziSet[] }) {
  const [selected, setSelected] = React.useState<HanziSet | null>(null);
  const [records, setRecords] = React.useState<Record<string, CodexRecord>>({});
  const topRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setRecords(getAllCodexRecords()), []);
  React.useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [selected]);

  return (
    <div ref={topRef}>
      {selected ? (
        <PracticeSession
          key={selected.id}
          set={selected}
          onExit={() => setSelected(null)}
          onComplete={() => setRecords(getAllCodexRecords())}
        />
      ) : (
        <SetLibrary sets={sets} records={records} onStart={setSelected} />
      )}
    </div>
  );
}

function SetLibrary({
  sets,
  records,
  onStart,
}: {
  sets: HanziSet[];
  records: Record<string, CodexRecord>;
  onStart: (set: HanziSet) => void;
}) {
  const [resumeIds, setResumeIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setResumeIds(
      sets.filter((set) => Boolean(readCodexSession(set))).map((set) => set.id),
    );
  }, [sets]);

  const totalQuestions = sets.reduce((sum, set) => sum + set.questions.length, 0);
  const completed = sets.filter((set) => records[set.id]).length;
  const recommended =
    sets.find((set) => resumeIds.includes(set.id)) ??
    sets.find((set) => !records[set.id]) ??
    [...sets].sort((a, b) => {
      const aScore = records[a.id]?.lastFirstTry / a.questions.length;
      const bScore = records[b.id]?.lastFirstTry / b.questions.length;
      return aScore - bScore;
    })[0];

  return (
    <div className="pb-12">
      <Link
        href="/subject/chinese"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 回國文基地
      </Link>

      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 px-6 py-7 text-white shadow-2xl shadow-indigo-200 sm:px-9 sm:py-9">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative grid gap-7 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black tracking-[0.14em] text-indigo-100">
              <Sparkles className="h-3.5 w-3.5" /> CODEX 版・精熟循環
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              形音義鍛字所
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-indigo-100/80 sm:text-base">
              不是做完就算了：答錯的字會隔幾題再回來，連續答對兩次才真正過關。
              國字題直接在田字格手寫，系統會辨識你寫的字。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-64">
            <HeroStat value={sets.length} label="關卡" />
            <HeroStat value={totalQuestions} label="考點" />
            <HeroStat value={`${completed}/${sets.length}`} label="已挑戰" />
          </div>
        </div>
      </section>

      {recommended && (
        <section className="mt-5 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-xl shadow-md shadow-amber-200">
              ⚡
            </span>
            <div>
              <p className="font-black text-amber-950">
                建議從「{recommended.title}」開始
              </p>
              <p className="mt-1 text-sm text-amber-800/75">
                {resumeIds.includes(recommended.id)
                  ? "上次還沒練完，進度已經幫你留著。"
                  : records[recommended.id]
                    ? "這組上次的一次答對率最低，現在複習最有效。"
                    : "按照教材順序，從還沒挑戰的關卡開始。"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onStart(recommended)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-600 sm:mt-0 sm:w-auto"
          >
            開始鍛字 <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      )}

      {[1, 2].map((week) => (
        <section key={week} className="mt-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black tracking-[0.16em] text-indigo-500">
                WEEK {week}
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-900">
                第{week === 1 ? "一" : "二"}週挑戰
              </h2>
            </div>
            <p className="text-right text-xs font-bold text-slate-400">
              每天一組・約 6–10 分鐘
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {sets
              .filter((set) => Math.ceil(set.order / 6) === week)
              .map((set) => (
                <SetCard
                  key={set.id}
                  set={set}
                  record={records[set.id]}
                  hasResume={resumeIds.includes(set.id)}
                  onStart={onStart}
                />
              ))}
          </div>
        </section>
      ))}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Rule
          icon={<CircleHelp className="h-4 w-4" />}
          title="不確定就按不會"
          text="誠實標記，系統會教完再安排回鍋。"
        />
        <Rule
          icon={<Flame className="h-4 w-4" />}
          title="錯題連對兩次"
          text="答對一次可能是剛看過；兩次才算穩。"
        />
        <Rule
          icon={<BookOpenCheck className="h-4 w-4" />}
          title="看一次答對率"
          text="完成率一定是 100%，實力看第一次答對幾題。"
        />
      </div>
    </div>
  );
}

function HeroStat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-2 py-4 backdrop-blur">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-[11px] font-bold text-indigo-200/75">{label}</div>
    </div>
  );
}

function Rule({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white/75 p-4 shadow-sm">
      <div className="flex items-center gap-2 font-black text-indigo-700">
        {icon}{title}
      </div>
      <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function SetCard({
  set,
  record,
  hasResume,
  onStart,
}: {
  set: HanziSet;
  record?: CodexRecord;
  hasResume: boolean;
  onStart: (set: HanziSet) => void;
}) {
  const score = record
    ? Math.round((record.lastFirstTry / set.questions.length) * 100)
    : null;
  const day = ((set.order - 1) % 6) + 1;
  return (
    <button
      type="button"
      onClick={() => onStart(set)}
      className="group rounded-3xl border border-white bg-white/80 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl text-xl",
          set.kind === "char" ? "bg-rose-100" : "bg-indigo-100",
        )}>
          {set.kind === "char" ? "✍️" : "🔤"}
        </span>
        {hasResume ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700">
            接續進度
          </span>
        ) : record ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
            已過關 {record.attempts} 次
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
            尚未挑戰
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-black tracking-wider text-slate-400">
        星期{["一", "二", "三", "四", "五", "六"][day - 1]}・{set.questions.length} 個考點
      </p>
      <h3 className="mt-1 text-lg font-black text-slate-900">
        {set.kind === "char" ? "看音寫國字" : "看字寫注音"}
      </h3>
      <p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-slate-500">
        {set.subtitle}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs font-bold text-slate-400">
          {score === null ? "準備好了嗎？" : `上次一次答對 ${score}%`}
        </span>
        <span className="flex items-center gap-1 text-xs font-black text-indigo-600 transition group-hover:translate-x-1">
          {hasResume ? "繼續" : "開始"} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

function PracticeSession({
  set,
  onExit,
  onComplete,
}: {
  set: HanziSet;
  onExit: () => void;
  onComplete: () => void;
}) {
  const saved = React.useMemo(() => readCodexSession(set), [set]);
  const [session, setSession] = React.useState<CodexSession>(
    () => saved ?? freshCodexSession(set),
  );
  const [phase, setPhase] = React.useState<Phase>("answering");
  const [typed, setTyped] = React.useState("");
  const [feedback, setFeedback] = React.useState<Feedback | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [strokeCount, setStrokeCount] = React.useState(0);
  const [resumed, setResumed] = React.useState(Boolean(saved));
  const padRef = React.useRef<HandwritingBoardHandle>(null);
  const savedCompletion = React.useRef(false);

  const current = set.questions.find((question) => question.id === session.queue[0]);
  const summary = codexSessionSummary(session, set.questions.length);
  const currentStat = current ? session.stats[current.id] : undefined;
  const isRepair = Boolean(currentStat?.wrongs);

  function record(correct: boolean, extra: Partial<Feedback> = {}) {
    setFeedback({ correct, ...extra });
    setPhase("feedback");
  }

  async function submit() {
    if (!current || checking) return;
    if (current.kind === "zhuyin") {
      record(isZhuyinCorrect(typed, current.answer));
      return;
    }
    const strokes = padRef.current?.getStrokes() ?? [];
    if (!strokes.length) return;
    setChecking(true);
    const candidates = await recognizeHandwriting(strokes, PAD_SIZE, PAD_SIZE);
    setChecking(false);
    if (candidates === null) {
      setPhase("selfjudge");
      return;
    }
    const top = candidates.slice(0, 5);
    record(top.includes(current.answer), { candidates: top, recognized: true });
  }

  function selfJudge(correct: boolean) {
    setSession((value) => ({
      ...value,
      recognitionOverrides: value.recognitionOverrides + 1,
    }));
    record(correct, { selfJudged: true });
  }

  function correctRecognitionMistake() {
    setSession((value) => ({
      ...value,
      recognitionOverrides: value.recognitionOverrides + 1,
    }));
    setFeedback((value) => value ? { ...value, correct: true, selfJudged: true } : value);
  }

  function advance() {
    if (!current || !feedback) return;
    const nextSession = applyCodexAnswer(session, current.id, feedback.correct);
    setTyped("");
    setFeedback(null);
    setStrokeCount(0);
    padRef.current?.clear();
    setResumed(false);

    if (nextSession.queue.length === 0) {
      setSession(nextSession);
      setPhase("done");
      clearCodexSession(set.id);
      if (!savedCompletion.current) {
        savedCompletion.current = true;
        const result = codexSessionSummary(nextSession, set.questions.length);
        const finishedAt = new Date().toISOString();
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - new Date(nextSession.startedAt).getTime()) / 1000),
        );
        saveCodexRecord({
          setId: set.id,
          lastFirstTry: result.firstTryCorrect,
          total: result.total,
          answerCount: result.answerCount,
          wrongQuestionIds: result.wrongQuestionIds,
          recognitionOverrides: nextSession.recognitionOverrides,
          durationSeconds,
          lastFinishedAt: finishedAt,
        });
        onComplete();
      }
      return;
    }

    setSession(nextSession);
    saveCodexSession(nextSession);
    setPhase("answering");
  }

  function restart() {
    const fresh = freshCodexSession(set);
    setSession(fresh);
    setPhase("answering");
    setTyped("");
    setFeedback(null);
    setStrokeCount(0);
    setResumed(false);
    savedCompletion.current = false;
    saveCodexSession(fresh);
    padRef.current?.clear();
  }

  if (phase === "done") {
    const final = codexSessionSummary(session, set.questions.length);
    const perfect = final.firstTryCorrect === final.total;
    const weakQuestions = set.questions.filter((question) =>
      final.wrongQuestionIds.includes(question.id),
    );
    return (
      <div className="pb-12">
        <button
          type="button"
          onClick={onExit}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" /> 回全部關卡
        </button>
        <section className="overflow-hidden rounded-[2rem] border border-white bg-white/85 p-7 text-center shadow-2xl shadow-indigo-100 sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-amber-300 to-orange-500 text-4xl shadow-xl shadow-amber-200">
            {perfect ? "🏆" : "⚔️"}
          </div>
          <p className="mt-5 text-xs font-black tracking-[0.18em] text-indigo-500">
            MASTERY COMPLETE
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            {perfect ? "一次全對，太強了！" : "弱點全部清掉了！"}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {set.title}・每一題都已通過精熟條件
          </p>
          <div className="mx-auto mt-7 grid max-w-lg grid-cols-3 gap-3">
            <ResultStat value={`${final.firstTryCorrect}/${final.total}`} label="一次答對" color="text-indigo-600" />
            <ResultStat value={final.answerCount} label="總作答次數" color="text-violet-600" />
            <ResultStat value="100%" label="最後精熟" color="text-emerald-600" />
          </div>
          {weakQuestions.length > 0 && (
            <div className="mt-7 rounded-2xl bg-slate-50 p-5 text-left">
              <p className="flex items-center gap-2 font-black text-slate-800">
                <Target className="h-4 w-4 text-rose-500" /> 今天補強的字
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {weakQuestions.map((question) => (
                  <span key={question.id} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm font-bold text-slate-700">
                    <b className="mr-2 text-lg text-rose-600">{question.answer}</b>
                    {question.concept}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={restart} className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold hover:bg-secondary">
              <RotateCcw className="h-4 w-4" /> 再練一次
            </button>
            <button type="button" onClick={onExit} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700">
              選下一關 <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!current) return null;
  const masteryPercent = Math.round((summary.mastered / set.questions.length) * 100);
  const canSubmit = current.kind === "zhuyin" ? Boolean(typed.trim()) : strokeCount > 0;

  return (
    <div className="pb-12">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button type="button" onClick={onExit} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> 關卡列表
        </button>
        <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-black text-slate-500 shadow-sm">
          {set.title}
        </span>
      </div>

      <header className="rounded-3xl border border-indigo-100 bg-white/80 p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-wider text-indigo-500">精熟進度</p>
            <p className="mt-1 font-black text-slate-900">
              已拿下 {summary.mastered} / {set.questions.length} 個考點
            </p>
          </div>
          <div className="text-right text-2xl font-black text-indigo-600">{masteryPercent}%</div>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-indigo-50">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${masteryPercent}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="每題精熟狀態">
          {set.questions.map((question) => {
            const stat = session.stats[question.id];
            return (
              <span
                key={question.id}
                title={question.concept}
                className={cn(
                  "h-2.5 min-w-3 flex-1 rounded-full",
                  stat?.mastered ? "bg-emerald-400" : stat?.wrongs ? "bg-amber-400" : "bg-slate-200",
                )}
              />
            );
          })}
        </div>
      </header>

      {resumed && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800">
          <span>已接上上次的進度，從這題繼續。</span>
          <button type="button" onClick={restart} className="shrink-0 text-xs underline">重新開始</button>
        </div>
      )}

      <main className="mt-4 overflow-hidden rounded-[2rem] border border-white bg-white/90 shadow-2xl shadow-indigo-100">
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-fuchsia-50 px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
              "rounded-full px-3 py-1 text-xs font-black",
              current.kind === "char" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700",
            )}>
              {current.kind === "char" ? "✍️ 看注音寫國字" : "🔤 看國字寫注音"}
            </span>
            {isRepair && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                回鍋驗收・還要連對 {Math.max(1, 2 - (currentStat?.streak ?? 0))} 次
              </span>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <Sentence question={current} />
          <p className="mt-3 text-sm font-medium text-slate-500">
            {current.kind === "char"
              ? "請在田字格寫出完整國字。"
              : "請用下面的注音鍵盤作答；一聲不用加符號。"}
          </p>

          {current.kind === "zhuyin" ? (
            <ZhuyinPad value={typed} onChange={setTyped} disabled={phase !== "answering"} />
          ) : (
            <HandwritingBoard
              key={current.id}
              ref={padRef}
              disabled={phase !== "answering"}
              onStrokeCount={setStrokeCount}
            />
          )}

          {phase === "answering" && (
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => record(false, { unsure: true })} className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold hover:bg-secondary">
                <CircleHelp className="h-4 w-4" /> 我不確定，先教我
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit || checking}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {checking ? "正在辨識筆跡…" : "送出答案"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {phase === "selfjudge" && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-black text-amber-900">辨識服務暫時連不上，改用誠實對照</p>
              <p className="mt-2 text-sm text-amber-800">
                正確答案是 <b className="mx-2 text-3xl">{current.answer}</b>，和田字格裡的一樣嗎？
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => selfJudge(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700">
                  <Check className="h-4 w-4" /> 一模一樣
                </button>
                <button type="button" onClick={() => selfJudge(false)} className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold hover:bg-secondary">
                  <X className="h-4 w-4" /> 不一樣，算錯
                </button>
              </div>
            </div>
          )}

          {phase === "feedback" && feedback && (
            <FeedbackPanel
              question={current}
              feedback={feedback}
              stat={currentStat}
              onRecognitionMistake={correctRecognitionMistake}
              onNext={advance}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function ResultStat({ value, label, color }: { value: React.ReactNode; label: string; color: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className={cn("text-2xl font-black", color)}>{value}</div>
      <div className="mt-1 text-[11px] font-bold text-slate-400">{label}</div>
    </div>
  );
}

function Sentence({ question }: { question: HanziQuestion }) {
  const match = question.sentence.match(/^(.*)【(.+?)】(.*)$/s);
  if (!match) {
    return <p className="text-xl font-bold leading-loose text-slate-900">{question.sentence}</p>;
  }
  return (
    <p className="text-xl font-bold leading-[2.2] text-slate-900 sm:text-2xl">
      {match[1]}
      <span className={cn(
        "mx-1 inline-flex min-w-12 items-center justify-center rounded-xl border-b-4 px-2 py-0.5 align-middle text-2xl font-black sm:text-3xl",
        question.kind === "char"
          ? "border-rose-500 bg-rose-50 text-rose-700"
          : "border-indigo-500 bg-indigo-50 text-indigo-700",
      )}>
        {match[2]}
      </span>
      {match[3]}
    </p>
  );
}

function ZhuyinPad({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-5">
      <div className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 px-4">
        <span className={cn(
          "text-3xl font-black tracking-[0.12em] text-indigo-700",
          !value && "text-base font-bold tracking-normal text-slate-400",
        )}>
          {value || "點選注音符號…"}
        </span>
        <button type="button" disabled={disabled || !value} onClick={() => onChange(value.slice(0, -1))} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-500 shadow-sm disabled:opacity-30">
          退格
        </button>
      </div>
      <div className="mt-3 select-none space-y-1.5 rounded-2xl bg-slate-50 p-2 sm:p-3" aria-label="注音鍵盤">
        {ZHUYIN_ROWS.map((row) => (
          <div key={row} className="flex justify-center gap-1 sm:gap-1.5">
            {row.split("").map((key) => (
              <button key={key} type="button" disabled={disabled} onClick={() => onChange(value + key)} className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white text-base font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 active:translate-y-0 disabled:opacity-40 sm:h-11 sm:text-lg">
                {key}
              </button>
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-1 sm:gap-1.5">
          {TONES.map((tone) => (
            <button key={tone} type="button" disabled={disabled} onClick={() => onChange(value + tone)} className="h-10 flex-1 rounded-lg border border-indigo-200 bg-indigo-100 text-lg font-black text-indigo-700 transition hover:bg-indigo-200 disabled:opacity-40 sm:h-11">
              {tone === "˙" ? "˙ 輕聲" : tone}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface HandwritingBoardHandle {
  getStrokes: () => Stroke[];
  clear: () => void;
}

const HandwritingBoard = React.forwardRef<
  HandwritingBoardHandle,
  { disabled: boolean; onStrokeCount: (count: number) => void }
>(function HandwritingBoard({ disabled, onStrokeCount }, ref) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const strokesRef = React.useRef<Stroke[]>([]);
  const drawingRef = React.useRef(false);

  const redraw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const dpr = window.devicePixelRatio || 1;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, PAD_SIZE, PAD_SIZE);
    context.save();
    context.strokeStyle = "rgba(99, 102, 241, 0.18)";
    context.lineWidth = 1;
    context.setLineDash([7, 7]);
    context.beginPath();
    context.moveTo(PAD_SIZE / 2, 0); context.lineTo(PAD_SIZE / 2, PAD_SIZE);
    context.moveTo(0, PAD_SIZE / 2); context.lineTo(PAD_SIZE, PAD_SIZE / 2);
    context.moveTo(0, 0); context.lineTo(PAD_SIZE, PAD_SIZE);
    context.moveTo(PAD_SIZE, 0); context.lineTo(0, PAD_SIZE);
    context.stroke();
    context.restore();
    context.strokeStyle = "#1e293b";
    context.lineWidth = 7;
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const [xs, ys] of strokesRef.current) {
      context.beginPath();
      xs.forEach((x, index) => index ? context.lineTo(x, ys[index]) : context.moveTo(x, ys[index]));
      if (xs.length === 1) context.lineTo(xs[0] + 0.1, ys[0] + 0.1);
      context.stroke();
    }
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = PAD_SIZE * dpr;
    canvas.height = PAD_SIZE * dpr;
    redraw();
  }, [redraw]);

  React.useImperativeHandle(ref, () => ({
    getStrokes: () => strokesRef.current,
    clear: () => {
      strokesRef.current = [];
      onStrokeCount(0);
      redraw();
    },
  }), [onStrokeCount, redraw]);

  function pointerPosition(event: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [
      Math.round(((event.clientX - rect.left) / rect.width) * PAD_SIZE),
      Math.round(((event.clientY - rect.top) / rect.height) * PAD_SIZE),
    ];
  }

  function undo() {
    strokesRef.current.pop();
    onStrokeCount(strokesRef.current.length);
    redraw();
  }

  function clear() {
    strokesRef.current = [];
    onStrokeCount(0);
    redraw();
  }

  return (
    <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-center">
      <div className="relative w-full max-w-[300px] overflow-hidden rounded-3xl border-2 border-indigo-200 bg-[#fffdf8] shadow-inner">
        <canvas
          ref={canvasRef}
          className={cn("block aspect-square w-full touch-none", disabled ? "pointer-events-none opacity-60" : "cursor-crosshair")}
          aria-label="手寫國字田字格"
          onPointerDown={(event) => {
            if (disabled) return;
            event.preventDefault();
            try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
            drawingRef.current = true;
            const [x, y] = pointerPosition(event);
            strokesRef.current.push([[x], [y]]);
            redraw();
          }}
          onPointerMove={(event) => {
            if (!drawingRef.current) return;
            const [x, y] = pointerPosition(event);
            const stroke = strokesRef.current[strokesRef.current.length - 1];
            stroke[0].push(x);
            stroke[1].push(y);
            redraw();
          }}
          onPointerUp={() => {
            if (!drawingRef.current) return;
            drawingRef.current = false;
            onStrokeCount(strokesRef.current.length);
          }}
          onPointerCancel={() => { drawingRef.current = false; }}
        />
        {strokesRef.current.length === 0 && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-black text-indigo-200">
            在這裡寫一個字
          </span>
        )}
      </div>
      <div className="flex gap-2 sm:flex-col">
        <button type="button" disabled={disabled || strokesRef.current.length === 0} onClick={undo} className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold hover:bg-secondary disabled:opacity-40">
          <Undo2 className="h-4 w-4" /> 上一筆
        </button>
        <button type="button" disabled={disabled || strokesRef.current.length === 0} onClick={clear} className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold hover:bg-secondary disabled:opacity-40">
          <Eraser className="h-4 w-4" /> 清除
        </button>
      </div>
    </div>
  );
});

function FeedbackPanel({
  question,
  feedback,
  stat,
  onRecognitionMistake,
  onNext,
}: {
  question: HanziQuestion;
  feedback: Feedback;
  stat?: CodexQuestionStat;
  onRecognitionMistake: () => void;
  onNext: () => void;
}) {
  return (
    <div className={cn(
      "mt-6 rounded-2xl border p-5",
      feedback.correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50",
    )}>
      <div className="flex items-start gap-3">
        <span className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white",
          feedback.correct ? "bg-emerald-500" : "bg-rose-500",
        )}>
          {feedback.correct ? <CheckCircle2 className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-lg font-black", feedback.correct ? "text-emerald-800" : "text-rose-800")}>
            {feedback.correct
              ? stat?.wrongs ? "答對！記憶正在變穩" : "答對了！"
              : feedback.unsure ? "先學會，再回來拿下它" : "差一點，這題會再回來"}
          </p>
          {!feedback.correct && (
            <p className="mt-1 text-sm font-bold text-rose-700">
              正確答案：<span className="ml-1 text-2xl">{question.answer}</span>
            </p>
          )}
          {feedback.candidates && feedback.candidates.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-500">
              <span>辨識結果</span>
              {feedback.candidates.map((candidate) => (
                <span key={candidate} className={cn(
                  "rounded-lg border bg-white px-2 py-1 text-base",
                  candidate === question.answer ? "border-emerald-300 text-emerald-700" : "border-slate-200 text-slate-600",
                )}>
                  {candidate}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 rounded-xl bg-white/75 p-4">
            <p className="flex items-center gap-1.5 text-xs font-black tracking-wide text-amber-600">
              <Sparkles className="h-3.5 w-3.5" /> 記住這一點
            </p>
            <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-slate-700">
              {question.explanation}
            </p>
            <p className="mt-2 text-xs font-bold text-slate-400">考點：{question.concept}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {!feedback.correct && feedback.recognized && !feedback.selfJudged ? (
          <button type="button" onClick={onRecognitionMistake} className="text-xs font-bold text-slate-500 underline decoration-dotted underline-offset-4 hover:text-indigo-600">
            我確定寫對了，是辨識看錯
          </button>
        ) : <span />}
        <button type="button" onClick={onNext} className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-white",
          feedback.correct ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700",
        )}>
          {feedback.correct ? "下一題" : "我記住了"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
