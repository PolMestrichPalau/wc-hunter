# WC HUNTER - Auto-Sincronizacion con GitHub (opcional)
# ATENCION: sube a 'main' (y por tanto publica la web) cada cambio local a los pocos segundos.
# Si no quieres publicar codigo a medio escribir, usa subir_a_github.bat a mano.
param(
    [int]$IntervalSeconds = 30
)

$baseDir = $PSScriptRoot
if (-not $baseDir) { $baseDir = Get-Location }

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " [AUTO-SYNC] WC HUNTER: Sincronizacion Continua ACTIVADA" -ForegroundColor Yellow
Write-Host " Directorio vigilado: $baseDir" -ForegroundColor Cyan
Write-Host " Intervalo: $IntervalSeconds s  (Ctrl+C para parar)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

while ($true) {
    try {
        $status = git -C $baseDir status --porcelain 2>$null

        if ($status) {
            # Espera a que termines de guardar (evita subir ficheros a medias)
            Start-Sleep -Seconds 5
            $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "[$now] Detectados cambios locales. Sincronizando..." -ForegroundColor Cyan

            git -C $baseDir add -A
            if ($LASTEXITCODE -ne 0) { throw "git add fallo (codigo $LASTEXITCODE)" }

            git -C $baseDir commit -m "auto: sincronizacion automatica [$now]"
            if ($LASTEXITCODE -ne 0) { throw "git commit fallo (codigo $LASTEXITCODE)" }

            $pushOut = git -C $baseDir push origin main 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[$now] ERROR al subir a GitHub (se reintentara):" -ForegroundColor Red
                Write-Host ($pushOut | Out-String) -ForegroundColor Red
            } else {
                Write-Host "[$now] Subido con exito a GitHub." -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "Error en auto-sync: $_" -ForegroundColor Red
    }

    Start-Sleep -Seconds $IntervalSeconds
}
