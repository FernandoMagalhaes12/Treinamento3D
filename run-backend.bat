@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
echo Iniciando backend...
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
	echo Python nao encontrado no PATH. Ative o ambiente Python e tente novamente.
	exit /b 1
)
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
