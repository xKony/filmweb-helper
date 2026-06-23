param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('firefox', 'chromium')]
    [string]$Target
)

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$source = Join-Path $root "manifests/manifest.$Target.json"
$dest = Join-Path $root "manifest.json"

if (-not (Test-Path $source)) {
    Write-Error "Manifest template not found: $source"
    exit 1
}

Copy-Item -Path $source -Destination $dest -Force
Write-Host "Applied $Target manifest -> manifest.json"
