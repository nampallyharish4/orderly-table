@echo off
setlocal

REM Start backend (Spring Boot)
start "Orderly Table - Backend" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location -Path '%~dp0backend'; if (Test-Path .env) { Get-Content .env | ForEach-Object { if ($_ -match '^[\s]*#' -or $_ -match '^[\s]*$') { return }; $parts = $_ -split '=',2; if ($parts.Length -eq 2) { [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim()) } } }; [System.Environment]::SetEnvironmentVariable('PORT','8081'); mvn spring-boot:run"

REM Start frontend (Vite)
start "Orderly Table - Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo Started backend and frontend in separate terminals.
echo Backend:  http://localhost:8081
echo Frontend: http://localhost:5000

endlocal
