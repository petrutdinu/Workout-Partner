# Workout Partner - Remove Stack Script
# Use this to completely remove the deployed stack

param(
    [string]$StackName = "workoutpartner"
)

Set-Location $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Workout Partner - Remove Stack" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Check Docker ──────────────────────────────────────────────────────────────
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# ── Remove stack ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Removing stack '$StackName'..." -ForegroundColor Yellow
docker stack rm $StackName

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Stack may not have been running." -ForegroundColor Yellow
} else {
    Write-Host "Stack '$StackName' removed." -ForegroundColor Green
}

Write-Host ""
Write-Host "Waiting for services to stop..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# ── Remove volumes (optional) ─────────────────────────────────────────────────
Write-Host ""
$removeVolumes = Read-Host "Remove data volumes? This will DELETE all database and cache data! (y/N)"
if ($removeVolumes -eq "y" -or $removeVolumes -eq "Y") {
    Write-Host ""
    Write-Host "Removing volumes..." -ForegroundColor Yellow

    $volumes = @(
        "${StackName}_postgres_data",
        "${StackName}_redis_data"
    )

    foreach ($vol in $volumes) {
        docker volume rm $vol 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Removed volume: $vol" -ForegroundColor Green
        } else {
            Write-Host "Volume not found (skipped): $vol" -ForegroundColor DarkGray
        }
    }

    Write-Host ""
    Write-Host "Volumes removed." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Volumes kept. Data is preserved for next deploy." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stack removed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To redeploy, run: .\deploy.ps1" -ForegroundColor Yellow
Write-Host ""
