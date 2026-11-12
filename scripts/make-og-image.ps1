# 사이트 공통 OG 이미지(1200x630, public/og.png)를 design/og.svg에서 만든다.
# og.svg는 글자를 도형(path)으로 바꿔 둔 원본이라 설치된 글꼴과 무관하게 같은 그림이 나온다.
# 문구를 바꾸려면 og.svg를 고친 뒤 이 스크립트를 다시 돌린다.
# 실행: pwsh scripts/make-og-image.ps1   (Windows, Microsoft Edge 또는 Chrome의 headless 모드 사용)
$ErrorActionPreference = 'Stop'

$root = Join-Path $PSScriptRoot '..'
$svg = (Resolve-Path (Join-Path $root 'design\og.svg')).Path
$out = Join-Path (Resolve-Path (Join-Path $root 'public')).Path 'og.png'

$browser = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw 'Microsoft Edge 또는 Chrome이 필요합니다.' }

# 평소 쓰는 브라우저 프로필과 섞이지 않게 임시 프로필로 띄운다.
$profileDir = Join-Path ([System.IO.Path]::GetTempPath()) "tyl-og-$PID"
try {
  # Start-Process는 인자를 공백으로 이어 붙이기만 하므로 경로가 든 인자는 따옴표로 감싼다.
  $browserArgs = @(
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    "`"--user-data-dir=$profileDir`"", '--window-size=1200,630', "`"--screenshot=$out`"", ([System.Uri]$svg).AbsoluteUri
  )
  Start-Process -FilePath $browser -ArgumentList $browserArgs -Wait -WindowStyle Hidden
} finally {
  Remove-Item -Recurse -Force $profileDir -ErrorAction SilentlyContinue
}

if (-not (Test-Path $out)) { throw "만들지 못했습니다: $out" }
"saved $out"
