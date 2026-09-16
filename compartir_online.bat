@echo off
setlocal
echo ======================================================================
echo    WC HUNTER — Compartir Servidor Publico Online
echo ======================================================================
echo.
echo 1. Comprobando servidor local en puerto 3000...
cd /d "%~dp0"

start /min powershell -ExecutionPolicy Bypass -File serve.ps1
timeout /t 2 /nobreak >nul

echo 2. Iniciando tunel HTTPS seguro de Cloudflare...
echo ----------------------------------------------------------------------
echo Mira el enlace HTTPS que aparecera abajo (https://xxxx.trycloudflare.com)
echo Copialo y enviaselo a tus amigos por WhatsApp o Telegram.
echo ----------------------------------------------------------------------
echo.

"..\cloudflared.exe" tunnel --http-host-header "localhost:3000" --url http://localhost:3000

pause
