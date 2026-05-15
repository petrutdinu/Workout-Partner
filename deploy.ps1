# Workout Partner - Build and Deploy Script for Windows
# Run this script to deploy the stack
#
# Usage:
#   .\deploy.ps1               - build all images and deploy
#   .\deploy.ps1 -Service user-service  - rebuild only one service then deploy
#   .\deploy.ps1 -SkipBuild    - deploy without rebuilding images
#   .\deploy.ps1 -Status       - show service status

param(
    [switch]$SkipBuild,
    [switch]$Status,
    [string]$Service = "",
    [string]$StackName = "workoutpartner"
)

Set-Location $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Workout Partner - Build and Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Status ────────────────────────────────────────────────────────────────────
if ($Status) {
    Write-Host "Service status for stack '$StackName':" -ForegroundColor Cyan
    docker stack services $StackName
    exit 0
}

# ── Check Docker ──────────────────────────────────────────────────────────────
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# ── Swarm init ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Checking Docker Swarm..." -ForegroundColor Yellow
$swarmState = (docker info --format '{{.Swarm.LocalNodeState}}' 2>$null)
if ($swarmState -ne "active") {
    Write-Host "Initializing Docker Swarm..." -ForegroundColor Yellow
    docker swarm init
} else {
    Write-Host "Docker Swarm is already active" -ForegroundColor Green
}

# ── Build images ──────────────────────────────────────────────────────────────
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "Building Docker images..." -ForegroundColor Yellow

    $services = @(
        @{ Name = "user-service";     Context = "backend/user-service" },
        @{ Name = "workout-service";  Context = "backend/workout-service" },
        @{ Name = "matching-service"; Context = "backend/matching-service" },
        @{ Name = "gym-service";      Context = "backend/gym-service" },
        @{ Name = "api-gateway";      Context = "backend/api-gateway" },
        @{ Name = "frontend";         Context = "frontend/react-app" }
    )

    if ($Service) {
        $services = $services | Where-Object { $_.Name -eq $Service }
        if (-not $services) {
            Write-Host "ERROR: Unknown service '$Service'." -ForegroundColor Red
            Write-Host "Valid services: user-service, workout-service, matching-service, gym-service, api-gateway, frontend" -ForegroundColor Yellow
            exit 1
        }
    }

    foreach ($svc in $services) {
        $imageName = "workoutpartner-$($svc.Name):latest"
        Write-Host ""
        Write-Host "Building $($svc.Name)..." -ForegroundColor Cyan
        docker build -t $imageName $svc.Context
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "ERROR: Failed to build $imageName" -ForegroundColor Red
            exit 1
        }
        Write-Host "OK: $imageName" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "All images built successfully!" -ForegroundColor Green
}

# ── Deploy ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Deploying stack '$StackName'..." -ForegroundColor Yellow
docker stack deploy -c docker/docker-stack.yml $StackName
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Deploy failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Waiting for services to start..." -ForegroundColor DarkGray
Start-Sleep -Seconds 8
docker stack services $StackName

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services are starting up. This may take a few minutes." -ForegroundColor Yellow
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  API Gateway: http://localhost:8000" -ForegroundColor White
Write-Host "  Keycloak:    http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "Keycloak Admin:" -ForegroundColor Cyan
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  .\deploy.ps1 -Status                        - check service replicas" -ForegroundColor White
Write-Host "  .\deploy.ps1 -SkipBuild                     - redeploy without rebuilding" -ForegroundColor White
Write-Host "  .\deploy.ps1 -Service api-gateway           - rebuild only one service" -ForegroundColor White
Write-Host "  .\remove-stack.ps1                          - stop and remove the stack" -ForegroundColor White
Write-Host "  docker service logs workoutpartner_<name>   - view service logs" -ForegroundColor White
Write-Host ""
