"use client";

import * as React from "react";
import Link from "next/link";
import { units } from "@/content";
import {
  getAllProgress,
  getLatestExplanation,
  saveExplanation,
  syncLocalToSupabase,
  type UnitProgress,
  type ExplanationRecord,
} from "@/lib/storage";
import { syncHomeworkLocalToSupabase } from "@/lib/homework-storage";
import {
  syncWenyanLocalToSupabase,
  getAllWenyanProgress,
} from "@/lib/wenyan-storage";
import { WenyanParentSummary } from "@/components/wenyan/wenyan-parent-summary";
import { QuizParentSummary } from "@/components/quiz-parent-summary";
import { HanziParentSummary } from "@/components/hanzi-parent-summary";
import { ExamParentSummary } from "@/components/exam-parent-summary";
import { PrepParentSummary } from "@/components/prep-parent-summary";
import {
  getAllPracticeDataCloud,
  syncPracticeLocalToSupabase,
  summarizePractice,
  type UnitPracticeData,
  type PracticeSummary,
  type ChallengeSession,
  type DrillEntry,
} from "@/lib/practice-storage";
import {
  getAllLatestDiagnoses,
  saveDiagnosis,
  type DiagnosisRecord,
} from "@/lib/diagnosis-storage";
import {
  requestDiagnosis,
  heuristicDiagnosis,
  type DiagnoseSignals,
} from "@/lib/diagnose";
import { requestAiFeedback } from "@/lib/explanation";
import { getCourseProgress } from "@/lib/course-storage";
import { curriculum, totalUnitSteps } from "@/content/curriculum";
import type { DrillQuestion } from "@/content/types";
import { isSupabaseEnabled } from "@/lib/supabase";
import {
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
  CheckCheck,
  Sparkles,
  GraduationCap,
  ArrowRight,
  Calculator,
  Wand2,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ABSORPTION_STYLE: Record<string, { cls: string; emoji: string }> = {
  扎實: { cls: "bg-correct/15 text-correct", emoji: "🟢" },
  大致理解: { cls: "bg-accent/15 text-accent", emoji: "🔵" },
  部分理解: { cls: "bg-gentle/20 text-gentle-foreground", emoji: "🟡" },
  還在背: { cls: "bg-destructive/10 text-destructive", emoji: "🔴" },
};

const SECTION_NAMES = ["情境引入", "引導推導", "用自己的話說", "變形題驗證", "回扣"];

const SELF_ASSESSMENT_LABEL: Record<string, { text: string; color: string }> = {
  got_it:       { text: "有講到重點 ✅",      color: "text-correct" },
  partial:      { text: "部分有講到",          color: "text-gentle-foreground" },
  cant_explain: { text: "講不太出來 🤔",       color: "text-destructive/80" },
};

type SyncState = "idle" | "syncing" | "done" | "error";

export default function ParentPage() {
  const [rows, setRows] = React.useState<
    { progress: UnitProgress | null; explanation: ExplanationRecord | null }[]
  >([]);
  const [practiceData, setPracticeData] = React.useState<
    Record<string, UnitPracticeData>
  >({});
  const [diagnoses, setDiagnoses] = React.useState<
    Record<string, DiagnosisRecord>
  >({});
  const [checkpointsDone, setCheckpointsDone] = React.useState(0);
  const [hasWenyan, setHasWenyan] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [syncState, setSyncState] = React.useState<SyncState>("idle");
  const [syncMsg, setSyncMsg] = React.useState("");
  const [analyzeState, setAnalyzeState] = React.useState<
    "idle" | "analyzing" | "done" | "error"
  >("idle");
  const [analyzeMsg, setAnalyzeMsg] = React.useState("");
  const [analyzeProg, setAnalyzeProg] = React.useState("");

  const loadAll = React.useCallback(async () => {
    const [allProgress, practice, diags, courseProg, wenyan] =
      await Promise.all([
        getAllProgress(),
        getAllPracticeDataCloud(),
        getAllLatestDiagnoses(),
        getCourseProgress(),
        getAllWenyanProgress(),
      ]);
    const progressMap: Record<string, UnitProgress> = {};
    for (const p of allProgress) progressMap[p.unitId] = p;

    const result = await Promise.all(
      units.map(async (u) => ({
        progress: progressMap[u.id] ?? null,
        explanation: await getLatestExplanation(u.id),
      })),
    );
    const checkpoints = curriculum.filter(
      (s) => s.kind === "review" && courseProg[s.id]?.completedAt,
    ).length;
    setRows(result);
    setPracticeData(practice);
    setDiagnoses(diags);
    setCheckpointsDone(checkpoints);
    setHasWenyan(wenyan.length > 0);
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // 把孩子已經寫過、但還沒經過 AI 判讀的解釋與單元表現補做 AI 分析，
  // 用的是跟單元流程裡完全相同的請求組法，結果寫回儲存層後直接顯示在各單元。
  async function handleAnalyzeAll() {
    setAnalyzeState("analyzing");
    setAnalyzeMsg("");
    let explained = 0;
    let diagnosedAi = 0;
    let diagnosedHeuristic = 0;
    try {
      for (let i = 0; i < units.length; i++) {
        const unit = units[i];
        setAnalyzeProg(`分析中…（${unit.title}）`);
        let explanation =
          rows[i]?.explanation ?? (await getLatestExplanation(unit.id));
        const progress = rows[i]?.progress ?? null;
        const pd = practiceData[unit.id];

        // 1) 第 3 段解釋的 AI 判讀（理解型 / 複述型）——只補還沒判讀過的
        if (
          explanation &&
          explanation.studentText.trim().length >= 2 &&
          !explanation.aiFeedback
        ) {
          const res = await requestAiFeedback({
            unitId: unit.id,
            unitTitle: unit.title,
            question: unit.section3_explain.prompt,
            conceptHint: unit.section3_explain.aiConceptHint ?? "",
            studentText: explanation.studentText,
          });
          if (res.ok && res.feedback && !res.fallbackToStatic) {
            const updated: ExplanationRecord = {
              ...explanation,
              aiFeedback: res.feedback,
              createdAt: new Date().toISOString(),
            };
            await saveExplanation(updated);
            explanation = updated;
            explained++;
          }
        }

        // 2) 整個單元的吸收度診斷——沒診斷、或舊的是離線啟發式，就用 AI 重做
        const variantResults = progress?.variantResults ?? {};
        const variantQs = unit.section4_variants.questions;
        const latestSession = pd?.sessions?.[0];
        const signals: DiagnoseSignals = {
          explanation: explanation?.studentText,
          selfAssessment: explanation?.selfAssessment ?? null,
          aiUnderstanding: explanation?.aiFeedback?.understanding_level ?? null,
          variants: variantQs
            .filter((q) => q.id in variantResults)
            .map((q) => ({
              question: q.question,
              testingWhat: q.testingWhat,
              likeTextbook: q.likeTextbook,
              correct: variantResults[q.id] === true,
            })),
          challenge: (latestSession?.results ?? []).map((r) => ({
            difficulty: r.difficulty,
            conceptAspect: r.conceptAspect,
            correct: r.mark === "correct",
          })),
        };
        const hasSignal =
          (signals.explanation?.trim().length ?? 0) > 0 ||
          signals.variants.length > 0 ||
          signals.challenge.length > 0;
        const existing = diagnoses[unit.id];
        if (hasSignal && (!existing || existing.source === "heuristic")) {
          const conceptHint =
            unit.section3_explain.aiConceptHint || unit.summary;
          const res = await requestDiagnosis({
            unitId: unit.id,
            unitTitle: unit.title,
            conceptHint,
            signals,
          });
          if (res.ok && res.diagnosis && !res.fallbackToStatic) {
            await saveDiagnosis({
              unitId: unit.id,
              diagnosis: res.diagnosis,
              source: "ai",
              signals,
              createdAt: new Date().toISOString(),
            });
            diagnosedAi++;
          } else if (!existing) {
            // AI 連不上、又還沒有任何診斷 → 至少存一筆本地啟發式，不要留白
            await saveDiagnosis({
              unitId: unit.id,
              diagnosis: heuristicDiagnosis(signals),
              source: "heuristic",
              signals,
              createdAt: new Date().toISOString(),
            });
            diagnosedHeuristic++;
          }
        }
      }
      await loadAll();
      const parts: string[] = [];
      if (explained) parts.push(`${explained} 筆解釋判讀`);
      if (diagnosedAi) parts.push(`${diagnosedAi} 個單元 AI 診斷`);
      if (diagnosedHeuristic) parts.push(`${diagnosedHeuristic} 個單元離線診斷`);
      setAnalyzeState("done");
      setAnalyzeMsg(
        parts.length > 0
          ? `完成：${parts.join("、")}`
          : "目前的紀錄都已經分析過了",
      );
    } catch (e) {
      setAnalyzeState("error");
      setAnalyzeMsg(String(e));
    } finally {
      setAnalyzeProg("");
    }
  }

  async function handleSync() {
    setSyncState("syncing");
    setSyncMsg("");
    try {
      const [math, hw, prac, wy] = await Promise.all([
        syncLocalToSupabase(),
        syncHomeworkLocalToSupabase(),
        syncPracticeLocalToSupabase(),
        syncWenyanLocalToSupabase(),
      ]);
      const errors = [math.error, hw.error, prac.error, wy.error].filter(
        Boolean,
      );
      if (errors.length > 0) {
        setSyncState("error");
        setSyncMsg(`部分失敗：${errors.join("；")}`);
      } else {
        const total =
          math.progressCount +
          math.explanationCount +
          hw.draftCount +
          hw.vocabCount +
          prac.practiceCount +
          wy.wenyanCount;
        setSyncState("done");
        setSyncMsg(
          total === 0
            ? "本機沒有新資料需要上傳"
            : `已上傳 ${total} 筆資料到雲端`,
        );
      }
    } catch (e) {
      setSyncState("error");
      setSyncMsg(String(e));
    }
  }

  const doneUnits = rows.filter((r) => Boolean(r.progress?.completedAt)).length;
  const anyData =
    rows.some((r) => r.progress !== null || r.explanation !== null) ||
    Object.keys(practiceData).length > 0 ||
    Object.keys(diagnoses).length > 0 ||
    hasWenyan;

  return (
    <div className="flex flex-1 flex-col py-8">
      {/* 頁頭 */}
      <div className="mb-1 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          回首頁
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">家長檢視</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        由上而下：學校考試（成績走勢、錯的概念）→ 考前複習頁的回鍋狀況 → 各科線上題目 →
        國文形音義／文言文 → 封存的暑假先修（數學五段式單元）。
      </p>

      {/* 學校考試：排程、成績走勢、錯的概念（exams.ts） */}
      <ExamParentSummary />

      {/* 考前複習頁：各頁翻卡的掌握狀況 */}
      <PrepParentSummary />

      {/* 提示：未啟用雲端時，資料只在孩子的裝置上 */}
      {!isSupabaseEnabled && (
        <div className="mt-4 rounded-xl border border-gentle/40 bg-gentle/10 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">注意：</span>
          目前未啟用雲端，資料只存在孩子使用的裝置裡。如果你現在用的不是孩子平常用來學習的裝置，這裡會是空的。
        </div>
      )}

      {/* 工具（同步 / AI 分析）——平常收合，減少版面干擾 */}
      <details className="group mt-4 rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            工具：跨裝置同步・AI 補分析
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t px-5 py-4">
      {/* 跨裝置同步 */}
      <div>
        <p className="text-sm font-medium">跨裝置同步</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          在孩子使用的裝置上，點「上傳到雲端」把本機資料推上去；之後在任何裝置開啟這頁都看得到。
        </p>
        {isSupabaseEnabled ? (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncState === "syncing"}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                syncState === "syncing"
                  ? "cursor-not-allowed bg-secondary text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {syncState === "syncing" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  上傳中…
                </>
              ) : syncState === "done" ? (
                <>
                  <CheckCheck className="h-4 w-4" />
                  再次上傳
                </>
              ) : (
                <>
                  <CloudUpload className="h-4 w-4" />
                  上傳本機資料到雲端
                </>
              )}
            </button>
            {syncMsg && (
              <span
                className={cn(
                  "text-sm",
                  syncState === "done" ? "text-correct" : "text-destructive",
                )}
              >
                {syncMsg}
              </span>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            雲端同步尚未啟用（需要設定 Supabase 環境變數後重新部署）。
          </p>
        )}
      </div>

      {/* 用 AI 分析目前已存在、但還沒判讀過的答案 */}
      {loaded && anyData && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium">用 AI 分析目前的答案</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            把孩子已經寫過、但還沒經過 AI 判讀的解釋與單元表現送給 AI，分析結果會直接顯示在下面各單元。
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleAnalyzeAll}
              disabled={analyzeState === "analyzing"}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                analyzeState === "analyzing"
                  ? "cursor-not-allowed bg-secondary text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {analyzeState === "analyzing" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  {analyzeProg || "分析中…"}
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  {analyzeState === "done"
                    ? "再分析一次"
                    : "用 AI 分析目前的答案"}
                </>
              )}
            </button>
            {analyzeMsg && (
              <span
                className={cn(
                  "text-sm",
                  analyzeState === "error"
                    ? "text-destructive"
                    : "text-correct",
                )}
              >
                {analyzeMsg}
              </span>
            )}
          </div>
        </div>
      )}
        </div>
      </details>

      {!loaded ? (
        <div className="mt-10 text-center text-muted-foreground">讀取中…</div>
      ) : (
        <>
          {/* ── 各科線上題目答題狀況（跨五科） ── */}
          <QuizParentSummary />

          {/* ── 國文・形音義大作戰 ── */}
          <HanziParentSummary />

          {/* ── 國文・文言文（古今異義） ── */}
          <WenyanParentSummary />

          {/* ── 封存：暑假先修（數學五段式單元、課表）── 平常收合 */}
          <details className="group mt-8 rounded-2xl border bg-card/60">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Calculator className="h-4 w-4" />
              封存・2026 暑假先修：數學五段式單元
              {loaded && (
                <span className="font-normal">
                  （完成 {doneUnits}/{totalUnitSteps} 單元、{checkpointsDone} 個檢核點）
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t px-5 py-4">
          <Link
            href="/course"
            className="group/course mb-4 flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 transition-all hover:border-primary/50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">完整先修課表</p>
                <p className="text-sm text-muted-foreground">
                  已完成 {doneUnits}/{totalUnitSteps} 單元、{checkpointsDone} 個間隔複習檢核點
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
          <section>
            {!anyData ? (
              <div className="rounded-xl border border-dashed bg-card/60 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  數學單元（五段式）還沒有紀錄——下面若有其他區塊，代表孩子已經從別的內容開始練了。
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  點單元名可以展開：孩子寫的解釋、變形題結果、練習區紀錄、AI 吸收度診斷。
                </p>
                <div className="space-y-3">
                  {units.map((unit, i) => {
                    const { progress, explanation } = rows[i] ?? {};
                    const pd = practiceData[unit.id];
                    const diag = diagnoses[unit.id] ?? null;
                    if (!progress && !explanation && !pd && !diag) return null;
                    return (
                      <UnitCard
                        key={unit.id}
                        unit={unit}
                        progress={progress ?? null}
                        explanation={explanation ?? null}
                        practice={pd ?? null}
                        diagnosis={diag}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </section>
          </div>
          </details>
        </>
      )}
    </div>
  );
}

function UnitCard({
  unit,
  progress,
  explanation,
  practice,
  diagnosis,
}: {
  unit: (typeof units)[number];
  progress: UnitProgress | null;
  explanation: ExplanationRecord | null;
  practice: UnitPracticeData | null;
  diagnosis: DiagnosisRecord | null;
}) {
  const reached = progress?.sectionReached ?? 0;
  const completed = Boolean(progress?.completedAt);
  const variantResults = progress?.variantResults ?? {};
  const variantQs = unit.section4_variants.questions;
  const hasVariants = Object.keys(variantResults).length > 0;

  const drillQuestions = unit.practiceZone?.drill.questions ?? [];
  const revealedDrills = drillQuestions.filter(
    (q) => practice?.drill[q.id]?.revealed,
  );
  const sessions = practice?.sessions ?? [];
  const latestSession = sessions[0] ?? null;
  const practiceSummary = summarizePractice(
    practice ?? undefined,
    drillQuestions.length,
  );
  const hasPractice = practiceSummary.practiced;

  const absorption = diagnosis
    ? (ABSORPTION_STYLE[diagnosis.diagnosis.absorption_level] ??
      ABSORPTION_STYLE["部分理解"])
    : null;

  return (
    <details className="group rounded-xl border bg-card">
      {/* 摘要列：單元名 + 狀態徽章（點了才展開細節） */}
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            單元 {unit.order}
          </p>
          <h2 className="truncate text-lg font-semibold">{unit.title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {absorption && diagnosis && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                absorption.cls,
              )}
            >
              {absorption.emoji} {diagnosis.diagnosis.absorption_level}
            </span>
          )}
          {completed ? (
            <span className="flex items-center gap-1.5 rounded-full bg-correct/15 px-3 py-1 text-sm font-medium text-correct">
              <CheckCircle2 className="h-4 w-4" />
              完成
            </span>
          ) : reached > 0 ? (
            <span className="rounded-full bg-secondary px-3 py-1 text-sm text-muted-foreground">
              第 {reached} 段・{SECTION_NAMES[reached - 1]}
            </span>
          ) : null}
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </div>
      </summary>

      <div className="space-y-5 border-t p-5">
        {/* 進度條 */}
        {progress && (
          <ProgressBar reached={reached} completed={completed} />
        )}

        {/* AI 吸收度診斷（完成單元時產生） */}
        {diagnosis && <DiagnosisBlock diagnosis={diagnosis} />}

        {/* 孩子寫的解釋（第 3 段） */}
        {explanation && (
          <ExplanationBlock explanation={explanation} unitTitle={unit.title} />
        )}

        {/* 變形題結果（第 4 段） */}
        {hasVariants && (
          <VariantResultBlock questions={variantQs} results={variantResults} />
        )}

        {/* 練習區記錄 */}
        {hasPractice && (
          <PracticeBlock
            summary={practiceSummary}
            sessions={sessions}
            drillQuestions={drillQuestions}
            drillData={practice?.drill ?? {}}
            revealedDrills={revealedDrills}
            latestSession={latestSession}
          />
        )}
      </div>
    </details>
  );
}

function ProgressBar({
  reached,
  completed,
}: {
  reached: number;
  completed: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">學習進度</p>
      <div className="flex items-center gap-1.5">
        {SECTION_NAMES.map((name, i) => {
          const n = i + 1;
          const done = n < reached || completed;
          const current = n === reached && !completed;
          return (
            <React.Fragment key={n}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold",
                    done && "border-correct bg-correct text-correct-foreground",
                    current && "border-primary bg-primary text-primary-foreground",
                    !done && !current && "border-border bg-card text-muted-foreground opacity-40",
                  )}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
                </div>
                <span className="hidden text-[10px] text-muted-foreground sm:block">
                  {name}
                </span>
              </div>
              {i < 4 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    n < reached || completed ? "bg-correct" : "bg-border opacity-40",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ExplanationBlock({
  explanation,
  unitTitle,
}: {
  explanation: ExplanationRecord;
  unitTitle: string;
}) {
  const sa = explanation.selfAssessment;
  const saInfo = sa ? SELF_ASSESSMENT_LABEL[sa] : null;
  const aiFb = explanation.aiFeedback;
  const date = new Date(explanation.createdAt).toLocaleDateString("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          第 3 段・孩子用自己的話解釋
        </p>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>

      {/* 孩子寫的文字 */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
          {explanation.studentText || (
            <span className="italic text-muted-foreground">（空白，沒有輸入）</span>
          )}
        </p>
      </div>

      {/* 自評（靜態模式） */}
      {saInfo && (
        <p className="text-sm">
          孩子自評：
          <span className={cn("font-medium", saInfo.color)}>
            {saInfo.text}
          </span>
        </p>
      )}

      {/* AI 回饋（AI 模式） */}
      {aiFb && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
          <p className="text-xs font-medium text-primary">AI 老師的回饋</p>
          <p className="text-sm">
            判斷：
            <span className="font-medium">
              {aiFb.understanding_level === "理解型" ? "✅ 理解型解釋" :
               aiFb.understanding_level === "複述型" ? "⚠️ 複述型（像在背）" :
               aiFb.understanding_level}
            </span>
          </p>
          {aiFb.followup_question && (
            <p className="text-sm text-muted-foreground">
              追問：{aiFb.followup_question}
            </p>
          )}
          {aiFb.encouragement && (
            <p className="text-sm text-muted-foreground">
              給孩子：{aiFb.encouragement}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DiagnosisBlock({ diagnosis }: { diagnosis: DiagnosisRecord }) {
  const d = diagnosis.diagnosis;
  const style =
    ABSORPTION_STYLE[d.absorption_level] ?? ABSORPTION_STYLE["部分理解"];
  const date = new Date(diagnosis.createdAt).toLocaleDateString("zh-TW", {
    month: "numeric",
    day: "numeric",
  });
  return (
    <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-xs font-medium text-primary">AI 吸收度診斷</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              style.cls,
            )}
          >
            {style.emoji} {d.absorption_level}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {date}
          {diagnosis.source === "heuristic" ? "・離線判斷" : ""}
        </span>
      </div>
      <div className="grid gap-1 text-sm">
        <p>
          <span className="text-muted-foreground">概念遷移：</span>
          <span className="font-medium">
            {d.transferred ? "已遷移（換外觀也抓得到）" : "尚未遷移"}
          </span>
        </p>
        {d.strengths && (
          <p>
            <span className="text-muted-foreground">強項：</span>
            {d.strengths}
          </p>
        )}
        {d.weakness && (
          <p>
            <span className="text-muted-foreground">要補：</span>
            {d.weakness}
          </p>
        )}
        {d.recommendation && (
          <p>
            <span className="text-muted-foreground">建議：</span>
            {d.recommendation}
          </p>
        )}
      </div>
      {d.parent_note && (
        <div className="rounded-md bg-card/70 px-3 py-2 text-sm">
          <span className="font-medium">給家長：</span>
          {d.parent_note}
        </div>
      )}
    </div>
  );
}

function VariantResultBlock({
  questions,
  results,
}: {
  questions: { id: string; question: string; testingWhat: string; likeTextbook: boolean }[];
  results: Record<string, boolean>;
}) {
  const answered = questions.filter((q) => q.id in results);
  if (answered.length === 0) return null;

  const correctCount = answered.filter((q) => results[q.id]).length;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          第 4 段・變形題驗證結果
        </p>
        <span className="text-xs font-medium">
          答對 {correctCount} / {answered.length} 題
        </span>
      </div>
      <div className="space-y-2">
        {answered.map((q, i) => {
          const isCorrect = results[q.id];
          return (
            <div
              key={q.id}
              className={cn(
                "rounded-lg border px-4 py-3",
                isCorrect ? "border-correct/30 bg-correct/5" : "border-gentle/30 bg-gentle/5",
              )}
            >
              <div className="flex items-start gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-correct" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gentle-foreground" />
                )}
                <div className="space-y-0.5">
                  <p className="text-[14px] leading-snug">
                    <span className="font-medium">第 {i + 1} 題{q.likeTextbook ? "（跟教材最像）" : "（換了外觀）"}：</span>
                    {q.question}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    考驗點：{q.testingWhat}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 診斷提示 */}
      {answered.length >= 3 && (() => {
        const textbookQ = questions.find((q) => q.likeTextbook);
        const nonTextbook = questions.filter((q) => !q.likeTextbook);
        const textbookOk = textbookQ && results[textbookQ.id] === true;
        const allNonFail = nonTextbook.every((q) => results[q.id] === false);
        if (textbookOk && allNonFail) {
          return (
            <div className="rounded-lg border border-gentle/40 bg-gentle/10 px-4 py-3 text-sm">
              <p className="font-medium">📌 認得題型，但概念還沒遷移</p>
              <p className="mt-0.5 text-muted-foreground">
                第 1 題（教材題型）對了，變形題卻卡住——這是「背題型、不懂概念」的典型。建議讓孩子回到第 2 段，重新走一次推導。
              </p>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}

// ─── 練習區記錄（家長視角） ─────────────────────────────────────────────────

const DIFF_LABEL: Record<string, string> = {
  basic: "直接",
  transfer: "換情境",
  synthesis: "多一個轉折",
};

function PracticeBlock({
  summary,
  sessions,
  drillQuestions,
  drillData,
  revealedDrills,
  latestSession,
}: {
  summary: PracticeSummary;
  sessions: ChallengeSession[];
  drillQuestions: DrillQuestion[];
  drillData: Record<string, DrillEntry>;
  revealedDrills: DrillQuestion[];
  latestSession: ChallengeSession | null;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground">練習區紀錄</p>

      {/* 總覽：做了幾回、最佳成績、手感題進度 */}
      <div className="flex flex-wrap items-center gap-2">
        {summary.challengeRounds > 0 && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
            變形題挑戰 {summary.challengeRounds} 回
          </span>
        )}
        {summary.bestTotal > 0 && (
          <span className="rounded-full bg-correct/15 px-2.5 py-1 text-xs font-medium text-correct">
            最佳 {summary.bestCorrect}/{summary.bestTotal}
          </span>
        )}
        {summary.drillTotal > 0 && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
            手感題 {summary.drillDone}/{summary.drillTotal}
          </span>
        )}
      </div>

      {/* 最近幾次成績走勢 */}
      {sessions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            最近{sessions.length}次成績
            {summary.challengeRounds > sessions.length && (
              <span>（共做 {summary.challengeRounds} 回，只留最近 {sessions.length} 次）</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {sessions.map((s, i) => {
              const correct = s.results.filter((r) => r.mark === "correct").length;
              const total = s.results.length;
              const full = total > 0 && correct === total;
              return (
                <span
                  key={s.sessionId ?? i}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium",
                    i === 0 && "ring-1 ring-primary/40",
                    full
                      ? "bg-correct/15 text-correct"
                      : "bg-gentle/15 text-gentle-foreground",
                  )}
                  title={i === 0 ? "最近一次" : `第 ${sessions.length - i} 新`}
                >
                  {correct}/{total}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 手感題 */}
      {revealedDrills.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">手感題（已作答）</p>
          <div className="overflow-hidden rounded-lg border text-sm">
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">題目</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">孩子的答案</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">正確答案</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {revealedDrills.map((q) => {
                  const entry = drillData[q.id];
                  const correct = q.answer;
                  const studentAns = entry?.answer ?? "";
                  const match =
                    studentAns.trim() === correct.trim();
                  return (
                    <tr key={q.id}>
                      <td className="px-3 py-2 text-muted-foreground">{q.question}</td>
                      <td className={cn("px-3 py-2 font-mono", match ? "text-correct" : "text-gentle-foreground")}>
                        {studentAns || <span className="italic text-muted-foreground">（空白）</span>}
                      </td>
                      <td className="px-3 py-2 font-mono text-foreground">{correct}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 最近一次變形題挑戰 */}
      {latestSession && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-xs text-muted-foreground">最近一次變形題挑戰</p>
            <span className="text-xs font-medium">
              答對{" "}
              {latestSession.results.filter((r) => r.mark === "correct").length}{" "}
              / {latestSession.results.length} 題
            </span>
          </div>
          <div className="space-y-2">
            {latestSession.results.map((r, i) => {
              const isCorrect = r.mark === "correct";
              return (
                <div
                  key={r.questionId}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm",
                    isCorrect
                      ? "border-correct/30 bg-correct/5"
                      : r.mark === "wrong"
                        ? "border-gentle/30 bg-gentle/5"
                        : "border-border bg-card",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-correct" />
                    ) : r.mark === "wrong" ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gentle-foreground" />
                    ) : (
                      <span className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="leading-snug">
                        <span className="font-medium">
                          第 {i + 1} 題
                          <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                            {DIFF_LABEL[r.difficulty] ?? r.difficulty}
                          </span>
                          ：
                        </span>
                        {r.question}
                      </p>
                      {r.studentAnswer && (
                        <p className="text-muted-foreground">
                          孩子寫的：
                          <span className="font-mono">{r.studentAnswer}</span>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        這題在考：{r.conceptAspect}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 弱點診斷：全錯 transfer+synthesis 題 */}
          {(() => {
            const wrong = latestSession.results.filter(
              (r) => r.mark === "wrong" && r.difficulty !== "basic",
            );
            if (wrong.length >= 2) {
              return (
                <div className="rounded-lg border border-gentle/40 bg-gentle/10 px-4 py-3 text-sm">
                  <p className="font-medium">📌 換情境就卡住了</p>
                  <p className="mt-0.5 text-muted-foreground">
                    換情境或多一個轉折的題目答錯 {wrong.length} 題——概念可能還停在「認得這個題型」，還沒真正遷移。建議讓孩子再回到第 2 段重新走推導。
                  </p>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
}
