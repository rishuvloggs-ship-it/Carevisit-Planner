@echo off
title CareVisit Planner - Unit Tests
set "PATH=C:\Users\Dell\.antigravity\nodejs\node-v20.18.0-win-x64;%PATH%"
cd /d "%~dp0server"
echo Running Overlap Engine Unit Tests...
node --test tests/*.test.js
pause
