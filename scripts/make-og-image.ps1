# 사이트 공통 OG 이미지(1200x630)를 만든다. 쓰기 화면과 같은 흰 바탕에 검정 글자.
# 실행: pwsh scripts/make-og-image.ps1   (Windows, 맑은 고딕 사용)
Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap 1200, 630
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
$g.Clear([System.Drawing.Color]::White)

$black = [System.Drawing.Brushes]::Black
$gray = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(85, 85, 85))
$title = New-Object System.Drawing.Font('Malgun Gothic', 92, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$sub = New-Object System.Drawing.Font('Malgun Gothic', 38, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$g.DrawString('할 말이 있는데', $title, $black, 84, 150)
$g.DrawString('나중에 할게', $title, $black, 84, 270)
$g.DrawString('정한 날짜 전에는 누구도 열 수 없는 편지', $sub, $gray, 90, 430)

$out = Join-Path $PSScriptRoot '..\public\og.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
"saved $out"
