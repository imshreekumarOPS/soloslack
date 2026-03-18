# Function to start a process in a new window
function Start-AppProcess {
    param (
        [string]$Directory,
        [string]$Command,
        [string]$Title
    )
    Write-Host "Starting $Title in $Directory..." -ForegroundColor Cyan
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$Directory'; $Command" -WindowStyle Normal
}

# Get the script's directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Server
Start-AppProcess -Directory "$ScriptDir\server" -Command "npm run dev" -Title "Server"

# Start Client
Start-AppProcess -Directory "$ScriptDir\client" -Command "npm run dev" -Title "Client"

Write-Host "Both processes started in separate windows." -ForegroundColor Green
