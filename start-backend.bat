@echo off
title CareVisit Planner - Backend Server (Port 5000)
set "PATH=C:\Users\Dell\.antigravity\nodejs\node-v20.18.0-win-x64;%PATH%"
cd /d "%~dp0server"
echo Starting CareVisit Planner Backend on port 5000...
node src/index.js
pause
