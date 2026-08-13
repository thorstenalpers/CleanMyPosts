<#
.SYNOPSIS
Fits raw screenshots to what the Chrome Web Store accepts.

.DESCRIPTION
The store takes 1280x800 or 640x400, JPEG or 24-bit PNG, and refuses anything with an alpha
channel — which is what a Windows screenshot tool produces by default, and why the originals
were rejected without ever being looked at.

Each image is scaled to fit inside the canvas, never past 2x, and centred on a flat background.
Not stretched: the sources are 1.59, 2.47 and 1.13 to one, and forcing them to 1.6 would show.
The 2x ceiling is there because these are screenshots of text — beyond it the resampling is
visible in the store's own detail view.

AMO takes the same files: it recommends 1280x800 and does not object to the format.
#>
param(
    [string]$Source = "$env:USERPROFILE\Desktop\CleanMyPosts",
    [string]$Destination = "$PSScriptRoot\..\extension\store-assets"
)

Add-Type -AssemblyName System.Drawing

# The tone the popup's own chrome sits on, so the padding reads as backdrop rather than as a
# border somebody forgot to crop.
$background = [System.Drawing.Color]::FromArgb(255, 237, 242, 250)
$width = 1280
$height = 800

$files = [ordered]@{
    'CleanMyPosts_Extension.png' = 'screenshot-1-lists.png'
    'Player.png'                 = 'screenshot-2-running.png'
    'Settings.png'               = 'screenshot-3-settings.png'
}

New-Item -ItemType Directory -Force $Destination | Out-Null

foreach ($name in $files.Keys) {
    $inPath = Join-Path $Source $name
    if (-not (Test-Path $inPath)) { throw "missing: $inPath" }

    $src = [System.Drawing.Bitmap]::FromFile($inPath)
    $scale = [Math]::Min([Math]::Min($width / $src.Width, $height / $src.Height), 2.0)
    $w = [int]($src.Width * $scale)
    $h = [int]($src.Height * $scale)

    # 24bpp: the format the store asks for, and the one that cannot carry an alpha channel.
    $out = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($out)
    $g.Clear($background)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, [int](($width - $w) / 2), [int](($height - $h) / 2), $w, $h)
    $g.Dispose()

    $outPath = Join-Path $Destination $files[$name]
    $out.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host ("{0,-28} {1}x{2} -> {3} at {4:N2}x" -f $name, $src.Width, $src.Height, $files[$name], $scale)

    $out.Dispose()
    $src.Dispose()
}
