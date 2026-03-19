@echo off
chcp 65001 >nul
echo ==========================================
echo   LOTO 3D Training - Inicialização Completa
echo ==========================================
echo.

set "PYTHON_CMD=python"
where %PYTHON_CMD% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set "PYTHON_CMD=C:\Users\C0719820\AppData\Local\Programs\Python\Python314\python.exe"
)

set "NODE_CMD=node"
where %NODE_CMD% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set "NODE_CMD=C:\temp\node\node.exe"
)

REM Verifica se o MongoDB já está rodando
echo [1/4] Verificando MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo      MongoDB já está rodando.
) else (
    echo      Iniciando MongoDB...
    start "MongoDB" cmd /c "cd /d C:\temp\mongo\bin && mongod.exe --dbpath C:\temp\mongo-data"
    timeout /t 3 /nobreak >nul
    echo      MongoDB iniciado.
)
echo.

REM Inicia o Backend
echo [2/4] Iniciando Backend (FastAPI)...
cd /d "%~dp0backend"
start "Backend - LOTO 3D" cmd /c "%PYTHON_CMD% -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul
echo      Backend iniciado em http://localhost:8000
echo.

REM Inicia o Frontend
echo [3/4] Iniciando Frontend (React)...
cd /d "%~dp0frontend"
start "Frontend - LOTO 3D" cmd /c "set WDS_SOCKET_PORT= && set PORT=3000 && %NODE_CMD% .\node_modules\@craco\craco\dist\bin\craco.js start"
timeout /t 5 /nobreak >nul
echo      Frontend iniciado em http://localhost:3000
echo.

REM Abre o navegador
echo [4/4] Abrindo navegador...
timeout /t 3 /nobreak >nul
start http://localhost:3000
echo      Navegador aberto.
echo.
echo ==========================================
echo   Todos os serviços iniciados com sucesso!
echo ==========================================
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul