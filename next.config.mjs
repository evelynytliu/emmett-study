/** @type {import('next').NextConfig} */

// BUILD_TARGET=pages 時，產出純靜態網站給 GitHub Pages 用：
//   - output: 'export' 產生 out/ 靜態檔
//   - basePath/assetPrefix 對應 https://<user>.github.io/<repo>/
//   - 靜態站沒有後端，AI route 不會被輸出（前端會自動退回靜態解釋）
//   - 靜態站不帶 Supabase 金鑰 → 自動用 localStorage，每位訪客各自獨立、不外洩
// 不設這個變數時（本機 npm run dev / npm run start）一切照舊，含 AI + Supabase。

const isPages = process.env.BUILD_TARGET === "pages";
// repo 名稱由部署工作流程注入（GitHub Actions 的 github.event.repository.name），
// 所以在 GitHub 上把 repo 改名不用改程式；本機建靜態版時可自己設 REPO_NAME。
const repo = process.env.REPO_NAME || "emmett-study";

const nextConfig = isPages
  ? {
      reactStrictMode: true,
      output: "export",
      basePath: `/${repo}`,
      assetPrefix: `/${repo}/`,
      trailingSlash: true,
      images: { unoptimized: true },
      // 讓前端能算出音檔等 public/ 資產的正確網址（公開版要帶 repo 前綴）
      env: { NEXT_PUBLIC_BASE_PATH: `/${repo}` },
    }
  : {
      reactStrictMode: true,
      experimental: {
        serverComponentsExternalPackages: ["@anthropic-ai/claude-agent-sdk"],
      },
      // 本機版沒有前綴，老師語音音檔走根路徑 /audio/...
      env: { NEXT_PUBLIC_BASE_PATH: "" },
    };

export default nextConfig;
