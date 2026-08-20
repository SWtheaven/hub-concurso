@echo off
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  start "Concurso Hub" /min py -m http.server 4173 --bind 127.0.0.1
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:4173"
  exit /b 0
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "Concurso Hub" /min python -m http.server 4173 --bind 127.0.0.1
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:4173"
  exit /b 0
)

echo Nao foi possivel iniciar o modo com integracoes.
echo Instale o Python ou abra o arquivo index.html para usar os recursos locais.
pause
