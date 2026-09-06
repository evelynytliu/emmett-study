"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

// 密碼門：只有在 NEXT_PUBLIC_APP_PASSCODE 有設定時才會啟用。
//   - 公開版（GitHub Pages）：CI 會帶入密碼 → 啟用密碼門。
//   - 本機完整版：.env.local 不設密碼 → 不啟用（自己的電腦不用每次輸入）。
//
// 注意：這是「靜態網站」的輕量保護，目的只是擋掉路過的陌生人。
// 因為沒有正式登入系統，密碼與金鑰都在前端，技術高手仍可能繞過——
// 但對個人自用、低敏感度的學習進度來說，這層保護足夠。

const PASSCODE = process.env.NEXT_PUBLIC_APP_PASSCODE;
const STORAGE_KEY = "gz-math:gate-ok";

export function PasscodeGate({ children }: { children: React.ReactNode }) {
  // PASSCODE 是建置時就決定的常數：沒設密碼 → 直接放行、不閃爍。
  const [unlocked, setUnlocked] = React.useState(!PASSCODE);
  const [checked, setChecked] = React.useState(!PASSCODE);
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!PASSCODE) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === PASSCODE) {
        setUnlocked(true);
      }
    } catch {
      /* 忽略 */
    }
    setChecked(true);
  }, []);

  if (unlocked) return <>{children}</>;
  if (!checked) return null; // 還在確認是否已解鎖，先不要閃出密碼框

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() === PASSCODE) {
      try {
        window.localStorage.setItem(STORAGE_KEY, PASSCODE as string);
      } catch {
        /* 忽略 */
      }
      setUnlocked(true);
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-16">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border bg-card p-7 shadow-sm"
      >
        <div className="flex items-center gap-2 text-primary">
          <Lock className="h-5 w-5" />
          <span className="font-semibold">Emmett 學習基地</span>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          這是私人學習網站，請輸入密碼進入。
        </p>
        <Input
          type="password"
          className="mt-4"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          placeholder="輸入密碼"
          autoFocus
        />
        {error && (
          <p className="mt-2 text-sm text-gentle-foreground">
            密碼不對，再試一次。
          </p>
        )}
        <Button type="submit" className="mt-4 w-full">
          進入
        </Button>
      </form>
    </div>
  );
}
