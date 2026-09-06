import type { Metadata } from "next";
import "./globals.css";
import { PasscodeGate } from "@/components/passcode-gate";
import { VoiceProvider } from "@/components/voice/voice-provider";
import { VoicePanel } from "@/components/voice/voice-panel";

export const metadata: Metadata = {
  title: "Emmett 學習基地｜國中五科複習與預習",
  description:
    "國中三年的複習與預習基地：考前複習頁、線上題組、五段式概念單元。重點都一樣：先遮答案、用自己的話想出來，不是照背。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen antialiased">
        <VoiceProvider>
          <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 sm:px-6">
            <PasscodeGate>{children}</PasscodeGate>
          </div>
          <VoicePanel />
        </VoiceProvider>
      </body>
    </html>
  );
}
