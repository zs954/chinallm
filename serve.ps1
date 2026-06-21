$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host 'ChinaLLM API preview: http://localhost:4173'
python -m http.server 4173 --bind 127.0.0.1
