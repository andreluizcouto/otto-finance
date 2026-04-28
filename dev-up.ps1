$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPort = 8000
$frontendPort = 5173

$backendCmd = "Set-Location '$root'; python -m uvicorn backend.main:app --host 127.0.0.1 --port $backendPort"
$frontendCmd = "Set-Location '$root'; npm run dev -- --host 127.0.0.1 --port $frontendPort"

Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $backendCmd) | Out-Null
Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $frontendCmd) | Out-Null

Start-Sleep -Seconds 3

$backendPid = Get-NetTCPConnection -State Listen -LocalPort $backendPort -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty OwningProcess
$frontendPid = Get-NetTCPConnection -State Listen -LocalPort $frontendPort -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty OwningProcess

if ($backendPid) {
    Write-Host "Backend ON  -> http://127.0.0.1:$backendPort (PID $backendPid)"
} else {
    Write-Host "Backend OFF -> veja a janela 'uvicorn' para erro."
}

if ($frontendPid) {
    Write-Host "Frontend ON -> http://127.0.0.1:$frontendPort (PID $frontendPid)"
} else {
    Write-Host "Frontend OFF -> veja a janela 'vite' para erro."
}
