@echo off
setlocal
cd /d "%~dp0worker"

where npm >nul 2>nul
if errorlevel 1 (
  echo O Node.js nao foi encontrado. Instale o Node.js LTS e tente novamente.
  pause
  exit /b 1
)

if not exist "node_modules" call npm install
if errorlevel 1 exit /b 1

call npm test
pause
