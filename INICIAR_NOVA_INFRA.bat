@echo off
setlocal
set "PROJECT_DIR=%~dp0"
if not exist "%PROJECT_DIR%worker\node_modules" (
  echo Preparando a infraestrutura na primeira execucao...
  pushd "%PROJECT_DIR%worker"
  call npm install
  popd
)
pushd "%PROJECT_DIR%worker"
start "Concurso Hub API" /min cmd /c npm run dev
popd
timeout /t 3 /nobreak >nul
pushd "%PROJECT_DIR%"
start "" "http://127.0.0.1:4173/?api=local"
python -m http.server 4173 --bind 127.0.0.1
popd
endlocal
