@echo off
title CareVisit Planner - Full Stack Launcher
echo Starting CareVisit Planner Full Stack Application...
start "CareVisit Backend" cmd /c "%~dp0start-backend.bat"
timeout /t 3 /nobreak >nul
start "CareVisit Frontend" cmd /c "%~dp0start-frontend.bat"
echo Applications launched!
echo Backend:  http://localhost:5000/api/health
echo Frontend: http://localhost:5173
