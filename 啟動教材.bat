@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo    Emmett 學習基地（本機完整版）
echo ========================================
echo.
if not exist node_modules (
  echo 第一次啟動，正在安裝必要元件，請稍候 1-2 分鐘...
  call npm install
  echo.
)
echo 啟動中... 稍等幾秒，瀏覽器會自動打開。
echo.
echo  ^>^> 要關閉網站：直接關掉這個黑色視窗就好。
echo.
start "" /min cmd /c "timeout /t 6 >nul & start http://localhost:3000"
npm run dev
