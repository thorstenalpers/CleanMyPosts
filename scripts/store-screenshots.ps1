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

<#
Promotional tiles.

Not screenshots: the store rejects a tile that is one, and a shrunk screenshot is unreadable
at 440x280 anyway. These are the icon, the wordmark and one line, on the same background the
screenshots use.

The icon is drawn from `src-tauri/icons/icon.png` at 512x512, so it is scaled down at every
size rather than up. The strapline is rendered rather than taken from an image, for the same
reason — it stays sharp on the 1400x560 tile, which is over three times the small one.
#>
function New-PromoTile {
    param([int]$W, [int]$H, [string]$Out)

    $icon = [System.Drawing.Bitmap]::FromFile((Resolve-Path 'src-tauri\icons\icon.png'))
    $bmp = New-Object System.Drawing.Bitmap $W, $H, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(255, 237, 242, 250))
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $unit = $H / 280.0
    $iconSize = [int](96 * $unit)
    $g.DrawImage($icon, [int](($W - $iconSize) / 2), [int](40 * $unit), $iconSize, $iconSize)

    $ink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 20, 20, 22))
    $grey = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 90, 96, 106))
    $centre = New-Object System.Drawing.StringFormat
    $centre.Alignment = [System.Drawing.StringAlignment]::Center

    $nameFont = New-Object System.Drawing.Font 'Segoe UI', ([float](34 * $unit)), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $lineFont = New-Object System.Drawing.Font 'Segoe UI', ([float](17 * $unit)), ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)

    $g.DrawString('CleanMyPosts', $nameFont, $ink, [float]($W / 2), [float](150 * $unit), $centre)
    $g.DrawString('Bulk-delete your posts, likes and comments', $lineFont, $grey, [float]($W / 2), [float](200 * $unit), $centre)
    $g.DrawString('on X and YouTube', $lineFont, $grey, [float]($W / 2), [float](226 * $unit), $centre)

    $g.Dispose()
    $bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host ("{0,-28} {1}x{2}" -f (Split-Path $Out -Leaf), $W, $H)
    $bmp.Dispose(); $icon.Dispose()
}

New-PromoTile -W 440  -H 280 -Out (Join-Path $Destination 'promo-440x280.png')
New-PromoTile -W 1400 -H 560 -Out (Join-Path $Destination 'promo-1400x560.png')
