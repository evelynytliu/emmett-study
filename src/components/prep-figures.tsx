// src/components/prep-figures.tsx
// 「點圖認部位」用的示意圖（純 SVG，不用課本照片）。
// 每張圖 viewBox 固定 0 0 200 260；熱點座標寫在 content/prep 資料檔裡，要跟這裡的圖對齊。
// 畫法刻意簡化：只要孩子看得出「哪個零件在哪裡」，跟課本圖的相對位置一致即可。

import type { PrepFigure } from "@/content/prep/types";

const body = "hsl(220 12% 88%)";
const bodyDark = "hsl(220 12% 72%)";
const metal = "hsl(220 10% 40%)";
const glass = "hsl(200 70% 85%)";
const stroke = "hsl(220 12% 45%)";

// ── 複式顯微鏡（單眼、斜筒、載物臺在中間、粗細調節輪在右側） ──
function CompoundMicroscope() {
  return (
    <g stroke={stroke} strokeWidth="1.2" strokeLinejoin="round">
      {/* 鏡座 */}
      <rect x="22" y="196" width="156" height="30" rx="6" fill={body} />
      {/* 鏡臂 */}
      <path
        d="M124 196 V 120 Q124 76 96 66 L96 54 H132 Q160 76 158 130 V196 Z"
        fill={bodyDark}
      />
      {/* 光源開關 */}
      <rect x="150" y="204" width="14" height="9" rx="2" fill={metal} />
      {/* 光源（電燈） */}
      <path d="M62 178 a18 18 0 0 1 36 0 Z" fill="hsl(45 95% 70%)" />
      <rect x="60" y="178" width="40" height="8" rx="2" fill={metal} />
      {/* 光圈 */}
      <ellipse cx="80" cy="150" rx="15" ry="5" fill={metal} />
      <circle cx="80" cy="150" r="3" fill={glass} />
      {/* 載物臺 */}
      <rect x="28" y="126" width="104" height="11" rx="2" fill="hsl(220 15% 25%)" />
      <ellipse cx="80" cy="131" rx="9" ry="2.5" fill={glass} />
      {/* 玻片夾 */}
      <path d="M52 126 v-5 h20" fill="none" strokeWidth="2" />
      <path d="M108 126 v-5 h-20" fill="none" strokeWidth="2" />
      {/* 粗調節輪 */}
      <circle cx="150" cy="152" r="17" fill={metal} />
      <circle cx="150" cy="152" r="11" fill={bodyDark} />
      {/* 細調節輪 */}
      <circle cx="168" cy="176" r="7" fill={metal} />
      {/* 鏡筒（斜） */}
      <path d="M60 30 L78 22 L104 80 L86 88 Z" fill="hsl(220 15% 20%)" />
      {/* 目鏡 */}
      <path d="M52 14 L74 4 L80 18 L58 28 Z" fill={metal} />
      <ellipse cx="63" cy="9" rx="9" ry="4" fill={glass} transform="rotate(-24 63 9)" />
      {/* 鏡頭座（連接鏡筒與鏡臂） */}
      <path d="M84 82 Q90 60 110 62 Q130 66 128 90 Q124 104 100 102 Q84 100 84 82 Z" fill={body} />
      {/* 旋轉盤 */}
      <ellipse cx="96" cy="103" rx="26" ry="6" fill={bodyDark} />
      {/* 物鏡（三支，長短不同） */}
      <rect x="72" y="106" width="8" height="11" rx="1.5" fill={metal} />
      <rect x="92" y="106" width="8" height="17" rx="1.5" fill={metal} />
      <rect x="110" y="106" width="8" height="8" rx="1.5" fill={metal} transform="rotate(20 114 106)" />
    </g>
  );
}

// ── 解剖顯微鏡（雙眼、倍率調整輪在鏡頭下、載物板在鏡座上、反射式＋透射式光源） ──
function DissectingMicroscope() {
  return (
    <g stroke={stroke} strokeWidth="1.2" strokeLinejoin="round">
      {/* 鏡座（含載物板凹槽） */}
      <rect x="20" y="150" width="160" height="76" rx="8" fill={body} />
      {/* 鏡臂 */}
      <path d="M126 150 V 90 Q126 62 150 60 H166 V150 Z" fill={bodyDark} />
      {/* 調節輪 */}
      <circle cx="166" cy="84" r="14" fill={metal} />
      <circle cx="166" cy="84" r="8" fill={bodyDark} />
      {/* 光源開關 */}
      <rect x="150" y="204" width="14" height="9" rx="2" fill={metal} />
      {/* 亮度調整器（兩個小滑桿） */}
      <rect x="30" y="208" width="18" height="4" rx="2" fill={metal} />
      <rect x="30" y="216" width="18" height="4" rx="2" fill={metal} />
      {/* 載物板＋透射式光源 */}
      <circle cx="80" cy="176" r="27" fill="hsl(45 95% 80%)" />
      <circle cx="80" cy="176" r="21" fill="hsl(0 0% 96%)" />
      {/* 固定夾 */}
      <path d="M60 170 q10 -8 20 0" fill="none" strokeWidth="2" />
      <path d="M100 170 q-10 -8 -20 0" fill="none" strokeWidth="2" />
      {/* 反射式光源（從鏡臂伸出、往下照） */}
      <path d="M126 104 L108 112 L112 124 L130 116 Z" fill={metal} />
      <path d="M110 124 L100 150 M118 122 L112 150" stroke="hsl(45 95% 60%)" strokeDasharray="2 2" fill="none" />
      {/* 鏡頭本體 */}
      <rect x="52" y="44" width="62" height="34" rx="8" fill={body} />
      {/* 倍率調整輪 */}
      <rect x="60" y="78" width="46" height="26" rx="4" fill="hsl(220 15% 20%)" />
      <rect x="60" y="88" width="46" height="5" fill={metal} />
      {/* 物鏡 */}
      <rect x="72" y="104" width="22" height="12" rx="2" fill={metal} />
      <ellipse cx="83" cy="116" rx="8" ry="2.5" fill={glass} />
      {/* 兩支目鏡（斜） */}
      <path d="M52 34 L64 8 L78 14 L66 40 Z" fill={metal} />
      <path d="M80 34 L92 8 L106 14 L94 40 Z" fill={metal} />
      <ellipse cx="71" cy="11" rx="7" ry="3" fill={glass} transform="rotate(24 71 11)" />
      <ellipse cx="99" cy="11" rx="7" ry="3" fill={glass} transform="rotate(24 99 11)" />
      {/* 眼焦調整器（右目鏡上的環） */}
      <path d="M86 24 L100 30" strokeWidth="3.5" stroke="hsl(220 15% 30%)" />
      {/* 眼距調整器（兩目鏡之間的橫桿） */}
      <rect x="62" y="38" width="42" height="6" rx="2" fill={bodyDark} />
    </g>
  );
}

export const FIGURES: Record<PrepFigure, () => JSX.Element> = {
  "microscope-compound": CompoundMicroscope,
  "microscope-dissecting": DissectingMicroscope,
};
