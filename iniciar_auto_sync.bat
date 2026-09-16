@echo off
setlocal
title WC Hunter — Auto-Sync GitHub
echo =======================================================
echo    Iniciando Auto-Sincronizador Continuo de WC HUNTER...
echo    Cualquier cambio se subira a GitHub automaticamente.
echo =======================================================
cd /d "%~dp0"
set "PATH=C:\Users\Usuario\.gemini\antigravity\scratch\mingit\cmd;%PATH%"

powershell -ExecutionPolicy Bypass -File auto_sync.ps1
pause
