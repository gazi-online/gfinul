$ErrorActionPreference = 'Stop'

$projectRoot = 'D:\PROJRCT\my project'
$logPath = Join-Path $projectRoot 'vite-live.log'
$errPath = Join-Path $projectRoot 'vite-live.err.log'

Set-Location $projectRoot

if (Test-Path $logPath) {
  Remove-Item -LiteralPath $logPath -Force
}

if (Test-Path $errPath) {
  Remove-Item -LiteralPath $errPath -Force
}

& npm.cmd run dev -- --host 127.0.0.1 --port 5174 1>> $logPath 2>> $errPath
