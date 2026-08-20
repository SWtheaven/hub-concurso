@echo off
setlocal
cd /d "%~dp0worker"

where npm >nul 2>nul
if errorlevel 1 (
  echo O Node.js nao foi encontrado. Instale o Node.js LTS e tente novamente.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Preparando as ferramentas do Worker...
  call npm install
  if errorlevel 1 goto :falha
)

echo Executando os testes da Etapa 7E...
call npm run test:deploy
if errorlevel 1 goto :falha

echo Preparando o Worker em dry-run, sem publicar...
call npm run check
if errorlevel 1 goto :falha

echo.
echo Worker validado e preparado. Nenhum deploy foi realizado.
pause
exit /b 0

:falha
echo.
echo A validacao nao foi concluida. Revise a mensagem acima.
pause
exit /b 1
