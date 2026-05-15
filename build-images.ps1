# Build all Docker images for Workout Partner
param(
    [string]$Tag = "latest",
    [string]$Registry = "",
    [string]$Service = ""   # build only one service if specified
)

Set-Location $PSScriptRoot

$services = @(
    @{ Name = "api-gateway";      Context = "backend/api-gateway" },
    @{ Name = "user-service";     Context = "backend/user-service" },
    @{ Name = "workout-service";  Context = "backend/workout-service" },
    @{ Name = "matching-service"; Context = "backend/matching-service" },
    @{ Name = "gym-service";      Context = "backend/gym-service" },
    @{ Name = "frontend";         Context = "frontend/react-app" }
)

if ($Service) {
    $services = $services | Where-Object { $_.Name -eq $Service }
    if (-not $services) {
        Write-Error "Unknown service '$Service'. Valid: api-gateway, user-service, workout-service, matching-service, gym-service, frontend"
        exit 1
    }
}

Write-Host "Building images (tag: $Tag)..." -ForegroundColor Cyan

foreach ($svc in $services) {
    # Image name must match docker-stack.yml: workoutpartner-<name>
    $imageName = if ($Registry) { "$Registry/workoutpartner-$($svc.Name):$Tag" } else { "workoutpartner-$($svc.Name):$Tag" }
    Write-Host "`nBuilding $imageName ..." -ForegroundColor Yellow
    docker build -t $imageName $svc.Context
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build $imageName"
        exit 1
    }
    Write-Host "OK: $imageName" -ForegroundColor Green
}

Write-Host "`nAll images built successfully!" -ForegroundColor Green
