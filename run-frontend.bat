@echo off
chcp 65001 >nul
cd /d "%~dp0frontend"
echo Iniciando frontend...
REM Evita que o WebSocket do dev-server (HMR) aponte para :443 por variavel global.
set "WDS_SOCKET_PORT="
REM Mantem o frontend no padrao CRA (http://localhost:3000)
set "PORT=3000"
set "NODE_CMD=node"
where %NODE_CMD% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
	set "NODE_CMD=C:\temp\node\node.exe"
)
%NODE_CMD% .\node_modules\@craco\craco\dist\bin\craco.js start
