-- supabase/schema.sql
-- 本專案的 Supabase 資料表。已透過 MCP migration 套用到
-- 「evelynytliu's Project」(oyqsqtscblflfnutqayj)。
-- 以 mathconcept_ 前綴與同一資料庫的其他專案（kiddolens_、錯題本…）明確分開。
-- 對應 CLAUDE.md 的資料結構。本專案單純自用，用寬鬆的存取政策。

-- 單元學習進度（每個單元一列）
create table if not exists public.mathconcept_progress (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null unique,
  section_reached int not null default 1,            -- 走到第幾段（1-5）
  completed_at timestamptz,                            -- 完成第 5 段才填
  variant_results jsonb not null default '{}'::jsonb, -- 第 4 段三題對錯
  updated_at timestamptz not null default now()
);

-- 孩子寫的解釋（第 3 段，可多筆）
create table if not exists public.mathconcept_explanations (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null,
  student_text text not null,
  self_assessment text,                               -- 'got_it' | 'partial' | 'cant_explain'
  ai_feedback jsonb,                                  -- AI 模式的回饋 JSON，可為 null
  created_at timestamptz not null default now()
);

create index if not exists mathconcept_explanations_unit_idx
  on public.mathconcept_explanations (unit_id, created_at desc);

-- ── 暑假作業引導 ──────────────────────────────────────
-- 報告類作業的草稿（每份作業一列；fields 是欄位 id → 孩子寫的文字）
create table if not exists public.mathconcept_homework_drafts (
  id uuid primary key default gen_random_uuid(),
  homework_id text not null unique,
  fields jsonb not null default '{}'::jsonb,
  hand_copied boolean not null default false,        -- 是否已把草稿手抄到作業本
  updated_at timestamptz not null default now()
);

-- 英文單字表的精熟進度（每份作業一列；記哪些卡已拼對過）
create table if not exists public.mathconcept_homework_vocab (
  id uuid primary key default gen_random_uuid(),
  homework_id text not null unique,
  mastered_card_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── 完整先修課表 + 練習區上雲 + 完成章節 AI 診斷 ──────────
-- 練習區（手感題 + 變形題挑戰）每單元一列（原本只存 localStorage，現上雲）
create table if not exists public.mathconcept_practice (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null unique,
  drill jsonb not null default '{}'::jsonb,
  sessions jsonb not null default '[]'::jsonb,
  challenge_rounds int not null default 0,
  updated_at timestamptz not null default now()
);

-- 每一輪變形題挑戰的「永久存檔」（append-only，不截斷、不覆蓋），供長期分析。
-- mathconcept_practice 只留最近 5 輪供 resume / 家長頁顯示；這張表保留全部歷史。
create table if not exists public.mathconcept_practice_sessions (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null,
  session_id text,
  results jsonb not null default '[]'::jsonb,
  correct int not null default 0,
  total int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists mathconcept_practice_sessions_unit_idx
  on public.mathconcept_practice_sessions (unit_id, created_at desc);

-- 螺旋複習：每做完一輪記一列（checkpoint_id 對應課表檢核點 rA/rB/rC，自由練習為 null）
create table if not exists public.mathconcept_spiral_sessions (
  id uuid primary key default gen_random_uuid(),
  checkpoint_id text,
  available_units jsonb not null default '[]'::jsonb,
  results jsonb not null default '[]'::jsonb,
  correct int not null default 0,
  total int not null default 0,
  created_at timestamptz not null default now()
);

-- 完成單元時的 AI（或本地啟發式）吸收度診斷，可多筆
create table if not exists public.mathconcept_diagnoses (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null,
  absorption_level text,            -- 扎實 | 大致理解 | 部分理解 | 還在背
  transferred boolean,              -- 變形題(非教材題)是否遷移
  strengths text,
  weakness text,
  recommendation text,
  next_action text,                 -- advance | spiral_review | redo_guided
  parent_note text,
  child_note text,
  source text,                      -- 'ai' | 'heuristic'
  signals jsonb,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mathconcept_diagnoses_unit_idx
  on public.mathconcept_diagnoses (unit_id, created_at desc);

-- ── 國文・文言文「古今異義」進度 ──────────────────────
-- 一個字一列：走到第幾拍、完成沒、變形題逐題對錯，
-- 以及第 3 拍孩子寫的解釋＋自評（存同一列，家長頁好呈現）。
create table if not exists public.mathconcept_wenyan_progress (
  id uuid primary key default gen_random_uuid(),
  word_id text not null unique,
  section_reached int not null default 1,            -- 走到第幾拍（1-5）
  completed_at timestamptz,                            -- 完成第 5 拍才填
  variant_results jsonb not null default '{}'::jsonb, -- 第 4 拍變形題對錯
  explanation text,                                   -- 第 3 拍孩子寫的解釋
  self_assessment text,                               -- 'got_it' | 'partial' | 'cant_explain'
  updated_at timestamptz not null default now()
);

-- ── 線上題組（五科共用）答題存檔 ──────────────────────
-- 每完成一輪題組 append 一筆（append-only，供家長頁看歷史與弱概念分析）。
-- first_try_correct = 第一次作答就對的題數（真實實力），total = 題組題數，
-- wrong_question_ids = 曾答錯過的題目 id（對回 concept 做弱點彙整）。
create table if not exists public.mathconcept_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id text not null,
  first_try_correct int not null default 0,
  total int not null default 0,
  wrong_question_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mathconcept_quiz_attempts_quiz_idx
  on public.mathconcept_quiz_attempts (quiz_id, created_at desc);

-- ── 國文形音義（注音精熟 / 手寫國字）答題存檔 ──────────
-- 每完成一輪 append 一筆。self_judged = 手寫辨識連不上、改用自評過關的題數。
create table if not exists public.mathconcept_hanzi_attempts (
  id uuid primary key default gen_random_uuid(),
  set_id text not null,
  first_try_correct int not null default 0,
  total int not null default 0,
  wrong_question_ids jsonb not null default '[]'::jsonb,
  self_judged int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists mathconcept_hanzi_attempts_set_idx
  on public.mathconcept_hanzi_attempts (set_id, created_at desc);

-- 題庫精熟狀態（單列 jsonb：uid → {m 精熟, w 錯誤次數, s 最後練到}）。
-- 跨裝置同步用：開練前拉下來合併、每輪結束 upsert 回去。
create table if not exists public.mathconcept_hanzi_pool (
  id uuid primary key default gen_random_uuid(),
  pool_key text not null unique default 'main',
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 完整先修課表：每個步驟完成紀錄（學單元 / 複習檢核點 / 結業）
create table if not exists public.mathconcept_course_progress (
  id uuid primary key default gen_random_uuid(),
  step_id text not null unique,
  completed_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 自用專案：開 RLS 但允許完整存取（資料只在自己機器上用）
alter table public.mathconcept_progress enable row level security;
alter table public.mathconcept_explanations enable row level security;
alter table public.mathconcept_homework_drafts enable row level security;
alter table public.mathconcept_homework_vocab enable row level security;
alter table public.mathconcept_practice enable row level security;
alter table public.mathconcept_practice_sessions enable row level security;
alter table public.mathconcept_spiral_sessions enable row level security;
alter table public.mathconcept_diagnoses enable row level security;
alter table public.mathconcept_course_progress enable row level security;
alter table public.mathconcept_wenyan_progress enable row level security;
alter table public.mathconcept_quiz_attempts enable row level security;
alter table public.mathconcept_hanzi_attempts enable row level security;
alter table public.mathconcept_hanzi_pool enable row level security;

drop policy if exists "mathconcept allow all progress" on public.mathconcept_progress;
create policy "mathconcept allow all progress" on public.mathconcept_progress
  for all using (true) with check (true);

drop policy if exists "mathconcept allow all explanations" on public.mathconcept_explanations;
create policy "mathconcept allow all explanations" on public.mathconcept_explanations
  for all using (true) with check (true);

drop policy if exists "mathconcept allow all hw drafts" on public.mathconcept_homework_drafts;
create policy "mathconcept allow all hw drafts" on public.mathconcept_homework_drafts
  for all using (true) with check (true);

drop policy if exists "mathconcept allow all hw vocab" on public.mathconcept_homework_vocab;
create policy "mathconcept allow all hw vocab" on public.mathconcept_homework_vocab
  for all using (true) with check (true);

drop policy if exists "mathconcept allow all practice" on public.mathconcept_practice;
create policy "mathconcept allow all practice" on public.mathconcept_practice
  for all using (true) with check (true);

drop policy if exists "mathconcept allow all practice sessions" on public.mathconcept_practice_sessions;
create policy "mathconcept allow all practice sessions" on public.mathconcept_practice_sessions
  for all using (true) with check (true);

drop policy if exists "mathconcept allow all spiral" on public.mathconcept_spiral_sessions;
create policy "mathconcept allow all spiral" on public.mathconcept_spiral_sessions
  for all using (true) with check (true);

drop policy if exists "mathconcept allow all diagnoses" on public.mathconcept_diagnoses;
create policy "mathconcept allow all diagnoses" on public.mathconcept_diagnoses
  for all using (true) with check (true);

drop policy if exists "mathconcept allow all course" on public.mathconcept_course_progress;
create policy "mathconcept allow all course" on public.mathconcept_course_progress
  for all using (true) with check (true);

drop policy if exists "mathconcept allow all wenyan" on public.mathconcept_wenyan_progress;
create policy "mathconcept allow all wenyan" on public.mathconcept_wenyan_progress
  for all using (true) with check (true);

drop policy if exists "mathconcept allow all quiz attempts" on public.mathconcept_quiz_attempts;
create policy "mathconcept allow all quiz attempts" on public.mathconcept_quiz_attempts
  for all using (true) with check (true);

drop policy if exists "mathconcept allow all hanzi attempts" on public.mathconcept_hanzi_attempts;
create policy "mathconcept allow all hanzi attempts" on public.mathconcept_hanzi_attempts
  for all using (true) with check (true);

drop policy if exists "mathconcept allow all hanzi pool" on public.mathconcept_hanzi_pool;
create policy "mathconcept allow all hanzi pool" on public.mathconcept_hanzi_pool
  for all using (true) with check (true);
