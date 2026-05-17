#Requires -Version 5.1
<#
.SYNOPSIS
    Sobe a API ClickBurger (HTTP :8082) e o Vite em src/clickburger-web em janelas separadas.

.DESCRIPTION
    Alinha a API com baseURL do axios em src/clickburger-web/src/services/api.ts (localhost:8082).
    MongoDB em localhost:27017 é apenas verificado com aviso; não bloqueia a execução.

.PARAMETER Build
    Executa dotnet build na solução antes de iniciar a API (dotnet run --no-build na janela da API).
#>
param(
    [switch]$Build
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

$SlnPath = Join-Path $RepoRoot 'src\ClickBurger\ClickBurger.sln'
$ApiProjDir = Join-Path $RepoRoot 'src\ClickBurger\ClickBurger'
$WebDir = Join-Path $RepoRoot 'src\clickburger-web'

if (-not (Test-Path $SlnPath)) {
    Write-Error "Solução não encontrada: $SlnPath. Use o script dentro do repositório (pasta scripts na raiz do projeto)."
    exit 1
}

if (-not (Test-Path $ApiProjDir)) {
    Write-Error "Projeto da API não encontrado: $ApiProjDir"
    exit 1
}

if (-not (Test-Path $WebDir)) {
    Write-Error "Frontend não encontrado: $WebDir"
    exit 1
}

# MongoDB (aviso apenas)
try {
    $mongoTest = Test-NetConnection -ComputerName 'localhost' -Port 27017 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($mongoTest -and -not $mongoTest.TcpTestSucceeded) {
        Write-Warning "MongoDB não está ouvindo em localhost:27017. Inicie o MongoDB ou configure ConnectionStrings:MongoDb; índices e persistência podem falhar."
    }
}
catch {
    Write-Warning "Não foi possível verificar MongoDB em localhost:27017."
}

# Porta da API (8082)
try {
    $port8082 = Test-NetConnection -ComputerName 'localhost' -Port 8082 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($port8082 -and $port8082.TcpTestSucceeded) {
        Write-Warning "A porta 8082 já está em uso. Encerre o processo que a usa ou altere ASPNETCORE_URLS / baseURL do frontend."
    }
}
catch {
    # ignorar falha do teste de porta
}

if ($Build) {
    Write-Host "[ClickBurger] dotnet build ClickBurger.sln (Debug)..."
    dotnet build $SlnPath -c Debug
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

$apiProjEscaped = $ApiProjDir.Replace("'", "''")
if ($Build) {
    $innerApi = "`$env:ASPNETCORE_URLS='http://localhost:8082'; `$env:ASPNETCORE_ENVIRONMENT='Development'; Set-Location '$apiProjEscaped'; dotnet run --no-build"
}
else {
    $innerApi = "`$env:ASPNETCORE_URLS='http://localhost:8082'; `$env:ASPNETCORE_ENVIRONMENT='Development'; Set-Location '$apiProjEscaped'; dotnet run"
}

Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-Command', $innerApi

$nodeModules = Join-Path $WebDir 'node_modules'
if (-not (Test-Path $nodeModules)) {
    Write-Host "[clickburger-web] npm install (primeira execução pode demorar)..."
    Push-Location $WebDir
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
    finally {
        Pop-Location
    }
}

$webEscaped = $WebDir.Replace("'", "''")
$innerWeb = "Set-Location '$webEscaped'; npm run dev"
Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-Command', $innerWeb

Write-Host ""
Write-Host "API (HTTP): http://localhost:8082"
Write-Host "Swagger (Development): http://localhost:8082/swagger"
Write-Host "Frontend: confira a URL do Vite na janela aberta (ex.: http://localhost:5173)."
Write-Host "Para encerrar, feche a janela da API ou a do Vite."
Write-Host ""
