@echo off
title CareVisit Planner - Frontend Client (Port 5173)
set "PATH=C:\Users\Dell\.antigravity\nodejs\node-v20.18.0-win-x64;%PATH%"
cd /d "%~dp0client"
echo Starting CareVisit Planner Frontend on http://localhost:5173...
npm run dev
pause
