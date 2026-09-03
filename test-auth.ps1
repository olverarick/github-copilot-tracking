$ErrorActionPreference = 'Stop'

function Decode-B64Url([string]$s) {
    $s = $s.Replace('-', '+').Replace('_', '/')
    switch ($s.Length % 4) { 2 { $s += '==' } 3 { $s += '=' } }
    [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($s))
}

Write-Host "=== 1. LOGIN (directo al backend :5001) ===" -ForegroundColor Cyan
$body = '{"username":"admin","password":"Copilot2025!"}'
$r = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" `
        -Method POST -ContentType "application/json" -Body $body
$tok = $r.token
Write-Host "Token length : $($tok.Length)"
Write-Host "Segmentos    : $($tok.Split('.').Count)  (deben ser 3)"
Write-Host "ExpiresAt    : $($r.expiresAt)"
Write-Host ""

Write-Host "=== 2. CONTENIDO DEL TOKEN ===" -ForegroundColor Cyan
Write-Host "--- header ---"
Decode-B64Url $tok.Split('.')[0]
Write-Host "--- payload ---"
Decode-B64Url $tok.Split('.')[1]
Write-Host ""

Write-Host "=== 3. Hora del host vs hora del contenedor ===" -ForegroundColor Cyan
Write-Host "Host UTC      : $([DateTime]::UtcNow.ToString('o'))"
try { Write-Host "Contenedor UTC: $(podman exec copilot-backend date -u -Iseconds)" }
catch { Write-Host "Contenedor UTC: (no se pudo leer)" }
Write-Host ""

Write-Host "=== 4. GET /auth/me DIRECTO AL BACKEND (:5001) ===" -ForegroundColor Cyan
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/me" `
              -Headers @{ Authorization = "Bearer $tok" } -UseBasicParsing
    Write-Host "HTTP $($resp.StatusCode)" -ForegroundColor Green
    Write-Host $resp.Content
} catch {
    $e = $_.Exception.Response
    Write-Host "HTTP $([int]$e.StatusCode)" -ForegroundColor Red
    Write-Host "WWW-Authenticate: $($e.Headers['WWW-Authenticate'])"
}
Write-Host ""

Write-Host "=== 5. GET /auth/me VIA NGINX (:8081) ===" -ForegroundColor Cyan
try {
    $resp2 = Invoke-WebRequest -Uri "http://localhost:8081/api/auth/me" `
               -Headers @{ Authorization = "Bearer $tok" } -UseBasicParsing
    Write-Host "HTTP $($resp2.StatusCode)" -ForegroundColor Green
    Write-Host $resp2.Content
} catch {
    $e2 = $_.Exception.Response
    Write-Host "HTTP $([int]$e2.StatusCode)" -ForegroundColor Red
    Write-Host "WWW-Authenticate: $($e2.Headers['WWW-Authenticate'])"
}
Write-Host ""

Write-Host "=== 6. Jwt__SecretKey efectivo dentro del contenedor ===" -ForegroundColor Cyan
try {
    $k = podman exec copilot-backend printenv Jwt__SecretKey
    if ([string]::IsNullOrEmpty($k)) { Write-Host "VACIA / NO DEFINIDA" -ForegroundColor Red }
    else { Write-Host "Longitud: $($k.Length)  SHA256: $((Get-FileHash -InputStream ([IO.MemoryStream]::new([Text.Encoding]::UTF8.GetBytes($k))) -Algorithm SHA256).Hash.Substring(0,16))" }
} catch { Write-Host "(no se pudo leer del contenedor)" }
