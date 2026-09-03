$ErrorActionPreference = 'Stop'

# ── Leer la clave desde .env (misma fuente que compose inyecta) ───────────────
$envLine = Get-Content .\.env | Where-Object { $_ -match '^\s*JWT_SECRET_KEY\s*=' } | Select-Object -First 1
$key = ($envLine -split '=', 2)[1].Trim()
Write-Host "Clave leida de .env - longitud: $($key.Length)" -ForegroundColor Cyan

# ── Login ────────────────────────────────────────────────────────────────────
$r = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"admin","password":"Copilot2025!"}'
$tok = $r.token
$parts = $tok.Split('.')
Write-Host "Token obtenido - longitud: $($tok.Length)"
Write-Host ""

# ── Recalcular la firma HMAC-SHA256 ──────────────────────────────────────────
$signingInput = "$($parts[0]).$($parts[1])"
$hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($key))
$computed = [Convert]::ToBase64String($hmac.ComputeHash([Text.Encoding]::ASCII.GetBytes($signingInput)))
$computed = $computed.TrimEnd('=').Replace('+','-').Replace('/','_')

Write-Host "=== VERIFICACION DE FIRMA ===" -ForegroundColor Cyan
Write-Host "Firma en el token : $($parts[2])"
Write-Host "Firma recalculada : $computed"
if ($computed -eq $parts[2]) {
    Write-Host "==> COINCIDEN: el token esta firmado con la clave de .env" -ForegroundColor Green
    Write-Host "    La firma es valida. El 401 NO es por firma." -ForegroundColor Green
} else {
    Write-Host "==> NO COINCIDEN: el proceso que firma usa OTRA clave" -ForegroundColor Red
}
Write-Host ""

# ── Inventario de contenedores: buscar instancias duplicadas ─────────────────
Write-Host "=== CONTENEDORES EN EJECUCION ===" -ForegroundColor Cyan
try { podman ps --format "{{.Names}}  {{.Image}}  {{.Ports}}  {{.CreatedAt}}" } catch { Write-Host "(podman no disponible)" }
Write-Host ""
Write-Host "=== ¿Hay tambien contenedores docker? ===" -ForegroundColor Cyan
try { docker ps --format "{{.Names}}  {{.Image}}  {{.Ports}}" 2>$null } catch { Write-Host "(docker no disponible / sin contenedores)" }
Write-Host ""
Write-Host "=== Quien escucha en el puerto 5001 ===" -ForegroundColor Cyan
netstat -ano | Select-String ":5001" | Select-Object -First 5
