param(
  [int]$Port = 5173,
  [string]$Dir = ".",
  [switch]$Open,
  [switch]$NoCache
)

$ErrorActionPreference = "Stop"

# Verify Node and npx
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js not found. Please install from https://nodejs.org and try again."
  exit 1
}
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
  Write-Error "npx not found. npx ships with Node.js; ensure it's on PATH and try again."
  exit 1
}

# Resolve directory
try { $fullDir = (Resolve-Path -Path $Dir).Path } catch {
  Write-Error "Directory not found: $Dir"
  exit 1
}

# Build npx serve arguments
$argsList = @("--yes", "serve", "-l", $Port.ToString())
if ($NoCache) { $argsList += @("-c", "0") } # disable caching
$argsList += $fullDir

Write-Host "Serving $fullDir on http://localhost:$Port" -ForegroundColor Green
Write-Host "If you map playbox.com to 127.0.0.1 in your hosts file, you can also use http://playbox.com:$Port" -ForegroundColor Yellow
if ($Open) { Start-Process "http://playbox.com:$Port" }

# Run server in foreground (Ctrl+C to stop)
& npx $argsList
