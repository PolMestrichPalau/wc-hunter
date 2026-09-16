@echo off
setlocal
echo =======================================================
echo    Sincronizando WC HUNTER con GitHub...
echo =======================================================
set "PATH=C:\Users\Usuario\.gemini\antigravity\scratch\mingit\cmd;%PATH%"
cd /d "%~dp0"

git add .
git commit -m "update: sincronizacion automatica de WC HUNTER"
git push -u origin main

echo.
echo =======================================================
echo    Listo! Cambios subidos a GitHub.
echo =======================================================
pause
