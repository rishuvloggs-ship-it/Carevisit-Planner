@echo off
title CareVisit Planner - Database Seeder
set "PATH=C:\Users\Dell\.antigravity\nodejs\node-v20.18.0-win-x64;%PATH%"
cd /d "%~dp0server"
echo Seeding CareVisit Planner Demo Data...
node src/seed.js
pause
