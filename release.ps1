param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# --- Preconditions -----------------------------------------------------------

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is not installed or not in PATH"
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI (gh) is not installed or not in PATH"
}

if (-not (Test-Path package.json)) {
    throw "package.json not found in current directory"
}

# --- Read version ------------------------------------------------------------

$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$version = $pkg.version

if (-not $version) {
    throw "package.json does not contain a version field"
}

$tag = "v$version"

Write-Host "Version: $version"
Write-Host "Tag:     $tag"

# --- Git sanity checks --------------------------------------------------------

$gitStatus = git status --porcelain
if ($gitStatus) {
    throw "Working tree is not clean. Commit changes before releasing."
}

$existingTag = git tag -l $tag
if ($existingTag) {
    throw "Tag $tag already exists"
}

# --- Create tag ---------------------------------------------------------------

if (-not $DryRun) {
    git tag $tag
    git push origin $tag
} else {
    Write-Host "[DryRun] git tag $tag"
    Write-Host "[DryRun] git push origin $tag"
}

# --- Find VSIX (optional) -----------------------------------------------------

$vsix = Get-ChildItem -Filter "*.vsix" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

$vsixArgs = @()
if ($vsix) {
    Write-Host "Found VSIX: $($vsix.Name)"
    $vsixArgs = @("--asset", $vsix.FullName)
}

# --- Create GitHub release ----------------------------------------------------

$ghArgs = @(
    "release", "create", $tag,
    "--title", $tag,
    "--generate-notes"
) + $vsixArgs

if (-not $DryRun) {
    gh @ghArgs
} else {
    Write-Host "[DryRun] gh $($ghArgs -join ' ')"
}

Write-Host "Release $tag created successfully."
