<#
  DevPortals — serveur local pour Windows (PowerShell 5.1+ inclus dans Windows 10/11, aucune installation).
  Lancé par DevPortals.bat. Laisse la fenêtre ouverte pendant que tu travailles.

  /studio/   l'application (accessible uniquement depuis ce PC)
  /          le portail joueurs (accessible depuis le réseau local)
  /data/     le contenu publié (site.json + médias)
  /api/...   publication, médias, sauvegardes (uniquement depuis ce PC)
#>
param([int]$Port = 8765, [switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$Root    = Split-Path -Parent $PSScriptRoot
$Studio  = Join-Path $Root 'studio'
$Portal  = Join-Path $Root 'portail'
$Data    = Join-Path $Root 'portail-data'
$Media   = Join-Path $Data 'media'
$Backups = Join-Path $Root 'sauvegardes'
$MdJs    = [System.IO.Path]::Combine($Studio, 'assets', 'js', 'md.js')
foreach ($d in @($Data, $Media, $Backups)) { if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d | Out-Null } }

$Mime = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'; '.gif' = 'image/gif'; '.ico' = 'image/x-icon'; '.mp3' = 'audio/mpeg'; '.ogg' = 'audio/ogg'; '.wav' = 'audio/wav'
  '.m4a' = 'audio/mp4'; '.flac' = 'audio/flac'; '.webm' = 'audio/webm'; '.txt' = 'text/plain; charset=utf-8'; '.woff2' = 'font/woff2'
}
$NameRe   = '^[A-Za-z0-9_.\-]{1,160}$'
$MediaExt = @('.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.mp3', '.ogg', '.wav', '.m4a', '.flac', '.webm', '.bin')
$MaxBody  = 500MB
$KeepBackups = 30
$Utf8 = New-Object System.Text.UTF8Encoding($false)
$Epoch = New-Object DateTime(1970, 1, 1, 0, 0, 0, [DateTimeKind]::Utc)

function Get-LanUrls {
  $list = New-Object System.Collections.ArrayList
  try {
    foreach ($ip in [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName())) {
      if ($ip.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) { continue }
      $s = $ip.ToString()
      if ($s.StartsWith('127.') -or $s.StartsWith('169.254.')) { continue }
      $u = "http://${s}:$Port/"
      if (-not $list.Contains($u)) { [void]$list.Add($u) }
    }
  } catch { }
  return $list
}

function Get-JsonString([string]$s) {
  if ($null -eq $s) { return 'null' }
  return '"' + ($s -replace '\\', '\\' -replace '"', '\"' -replace "`r", '\r' -replace "`n", '\n' -replace "`t", '\t') + '"'
}

function Get-UnixMs([DateTime]$d) { return [long]($d.ToUniversalTime() - $Epoch).TotalMilliseconds }

function Send-Bytes($stream, [int]$status, [byte[]]$body, [string]$ctype, $extra, [bool]$head) {
  $reasons = @{ 200 = 'OK'; 206 = 'Partial Content'; 302 = 'Found'; 400 = 'Bad Request'; 403 = 'Forbidden'; 404 = 'Not Found'; 413 = 'Payload Too Large'; 416 = 'Range Not Satisfiable'; 500 = 'Internal Server Error' }
  $reason = 'OK'; if ($reasons.ContainsKey($status)) { $reason = $reasons[$status] }
  if ($null -eq $body) { $body = New-Object byte[] 0 }
  $h = "HTTP/1.1 $status $reason`r`nContent-Type: $ctype`r`nContent-Length: $($body.Length)`r`nConnection: close`r`nX-Content-Type-Options: nosniff`r`n"
  if ($extra) { foreach ($k in $extra.Keys) { $h += "${k}: $($extra[$k])`r`n" } }
  $h += "`r`n"
  $hb = [System.Text.Encoding]::ASCII.GetBytes($h)
  $stream.Write($hb, 0, $hb.Length)
  if (-not $head -and $body.Length -gt 0) { $stream.Write($body, 0, $body.Length) }
  $stream.Flush()
}

function Send-Text($stream, [int]$status, [string]$text, [string]$ctype = 'text/plain; charset=utf-8') {
  $b = $Utf8.GetBytes($text)
  Send-Bytes $stream $status $b $ctype $null $false
}

function Send-Json($stream, [string]$json) {
  $b = $Utf8.GetBytes($json)
  Send-Bytes $stream 200 $b 'application/json; charset=utf-8' @{ 'Cache-Control' = 'no-store' } $false
}

function Resolve-Static([string]$base, [string]$rel) {
  $sep = [System.IO.Path]::DirectorySeparatorChar
  $rel = $rel.TrimStart('/')
  if ($rel -eq '') { $rel = 'index.html' }
  $rel = $rel.Replace('/', $sep)
  try { $full = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($base, $rel)) } catch { return $null }
  $b = [System.IO.Path]::GetFullPath($base).TrimEnd($sep) + $sep
  if (-not $full.StartsWith($b, [System.StringComparison]::OrdinalIgnoreCase)) { return $null }
  if ([System.IO.Directory]::Exists($full)) { $full = [System.IO.Path]::Combine($full, 'index.html') }
  if ([System.IO.File]::Exists($full)) { return $full }
  return $null
}

function Send-File($stream, $req, [string]$file, [string]$cache) {
  $ext = [System.IO.Path]::GetExtension($file).ToLower()
  $ctype = 'application/octet-stream'
  if ($Mime.ContainsKey($ext)) { $ctype = $Mime[$ext] }
  $bytes = [System.IO.File]::ReadAllBytes($file)
  $extra = @{ 'Accept-Ranges' = 'bytes'; 'Cache-Control' = $cache }
  $head = ($req.Method -eq 'HEAD')
  $range = $req.Headers['range']
  if ($range -and ($range -match '^bytes=(\d*)-(\d*)$') -and $bytes.Length -gt 0 -and ($Matches[1] -or $Matches[2])) {
    $total = [long]$bytes.Length
    if ($Matches[1]) {
      $start = [long]$Matches[1]
      if ($Matches[2]) { $end = [long]$Matches[2] } else { $end = $total - 1 }
    } else {
      $start = [Math]::Max([long]0, $total - [long]$Matches[2]); $end = $total - 1
    }
    if ($end -gt $total - 1) { $end = $total - 1 }
    if ($start -gt $end) { $extra['Content-Range'] = "bytes */$total"; Send-Bytes $stream 416 $null $ctype $extra $false; return }
    $len = [int]($end - $start + 1)
    $part = New-Object byte[] $len
    [Array]::Copy($bytes, $start, $part, 0, $len)
    $extra['Content-Range'] = "bytes $start-$end/$total"
    Send-Bytes $stream 206 $part $ctype $extra $head
    return
  }
  Send-Bytes $stream 200 $bytes $ctype $extra $head
}

function Read-Request($stream) {
  $buffer = New-Object byte[] 65536
  $ms = New-Object System.IO.MemoryStream
  $headerEnd = -1
  $text = ''
  while ($headerEnd -lt 0) {
    $n = $stream.Read($buffer, 0, $buffer.Length)
    if ($n -le 0) { return $null }
    $ms.Write($buffer, 0, $n)
    $text = [System.Text.Encoding]::ASCII.GetString($ms.GetBuffer(), 0, [int]$ms.Length)
    $headerEnd = $text.IndexOf("`r`n`r`n")
    if ($headerEnd -lt 0 -and $ms.Length -gt 65536) { return $null }
  }
  $lines = $text.Substring(0, $headerEnd) -split "`r`n"
  $parts = $lines[0].Split(' ')
  if ($parts.Length -lt 2) { return $null }
  $headers = @{}
  for ($i = 1; $i -lt $lines.Length; $i++) {
    $idx = $lines[$i].IndexOf(':')
    if ($idx -gt 0) { $headers[$lines[$i].Substring(0, $idx).Trim().ToLower()] = $lines[$i].Substring($idx + 1).Trim() }
  }
  $len = [long]0
  if ($headers.ContainsKey('content-length')) { $len = [long]$headers['content-length'] }
  if ($len -gt $MaxBody) { return @{ TooLarge = $true } }
  $all = $ms.ToArray()
  $bodyStart = $headerEnd + 4
  $body = New-Object byte[] ([int]$len)
  $have = [Math]::Min([long]($all.Length - $bodyStart), $len)
  if ($have -gt 0) { [Array]::Copy($all, $bodyStart, $body, 0, [int]$have) }
  $got = [int]$have
  while ($got -lt $len) {
    $n = $stream.Read($body, $got, [int]($len - $got))
    if ($n -le 0) { break }
    $got += $n
  }
  $target = $parts[1]
  $q = ''
  $qi = $target.IndexOf('?')
  if ($qi -ge 0) { $q = $target.Substring($qi + 1); $target = $target.Substring(0, $qi) }
  $query = @{}
  foreach ($pair in $q.Split('&')) {
    if ($pair -eq '') { continue }
    $kv = $pair.Split('=', 2)
    $v = ''; if ($kv.Length -gt 1) { $v = [System.Uri]::UnescapeDataString($kv[1].Replace('+', ' ')) }
    $query[[System.Uri]::UnescapeDataString($kv[0])] = $v
  }
  return @{ Method = $parts[0].ToUpper(); Path = [System.Uri]::UnescapeDataString($target); Query = $query; Headers = $headers; Body = $body }
}

function Invoke-Api($stream, $req) {
  $m = $req.Method; $path = $req.Path
  if ($path -eq '/api/info') {
    $site = Join-Path $Data 'site.json'
    $pub = 'null'
    if (Test-Path -LiteralPath $site) { $pub = [string](Get-UnixMs (Get-Item -LiteralPath $site).LastWriteTime) }
    $urls = (Get-LanUrls | ForEach-Object { Get-JsonString $_ }) -join ','
    Send-Json $stream ('{"app":"DevPortals","server":"powershell","port":' + $Port + ',"urls":[' + $urls + '],"published":' + $pub + ',"root":' + (Get-JsonString $Root) + '}')
    return
  }
  if ($path -eq '/api/media' -and $m -eq 'GET') {
    $names = @(Get-ChildItem -LiteralPath $Media -File | ForEach-Object { Get-JsonString $_.Name })
    Send-Json $stream ('[' + ($names -join ',') + ']')
    return
  }
  if ($path -eq '/api/media' -and $m -eq 'POST') {
    $name = [string]$req.Query['name']
    if ($name -notmatch $NameRe -or $MediaExt -notcontains [System.IO.Path]::GetExtension($name).ToLower()) { Send-Text $stream 400 'invalid name'; return }
    [System.IO.File]::WriteAllBytes((Join-Path $Media $name), $req.Body)
    Send-Json $stream '{"ok":true}'
    return
  }
  if ($path -eq '/api/publish' -and $m -eq 'POST') {
    $txt = $Utf8.GetString($req.Body).TrimStart([char]0xFEFF, ' ', "`t", "`r", "`n")
    if (-not $txt.StartsWith('{')) { Send-Text $stream 400 'invalid json'; return }
    $tmp = Join-Path $Data 'site.json.tmp'
    [System.IO.File]::WriteAllBytes($tmp, $req.Body)
    Move-Item -LiteralPath $tmp -Destination (Join-Path $Data 'site.json') -Force
    Send-Json $stream '{"ok":true}'
    return
  }
  if ($path -eq '/api/prune' -and $m -eq 'POST') {
    $keep = New-Object 'System.Collections.Generic.HashSet[string]'
    foreach ($l in ($Utf8.GetString($req.Body) -split "`r?`n")) { if ($l.Trim() -ne '') { [void]$keep.Add($l.Trim()) } }
    $removed = 0
    foreach ($f in Get-ChildItem -LiteralPath $Media -File) {
      if (-not $keep.Contains($f.Name) -and $f.Name -match $NameRe) { Remove-Item -LiteralPath $f.FullName -Force; $removed++ }
    }
    Send-Json $stream ('{"ok":true,"removed":' + $removed + '}')
    return
  }
  if ($path -eq '/api/unpublish' -and $m -eq 'POST') {
    $site = Join-Path $Data 'site.json'
    if (Test-Path -LiteralPath $site) { Remove-Item -LiteralPath $site -Force }
    Send-Json $stream '{"ok":true}'
    return
  }
  if ($path -eq '/api/backup' -and $m -eq 'POST') {
    $name = [string]$req.Query['name']
    if ($name -notmatch $NameRe -or -not $name.EndsWith('.json')) { Send-Text $stream 400 'invalid name'; return }
    [System.IO.File]::WriteAllBytes((Join-Path $Backups $name), $req.Body)
    $prefix = $name.Split(@('__'), [System.StringSplitOptions]::None)[0] + '__'
    Get-ChildItem -LiteralPath $Backups -File | Where-Object { $_.Name.StartsWith($prefix) } | Sort-Object LastWriteTime -Descending | Select-Object -Skip $KeepBackups | Remove-Item -Force
    Send-Json $stream '{"ok":true}'
    return
  }
  if ($path -eq '/api/backups' -and $m -eq 'GET') {
    $items = @(Get-ChildItem -LiteralPath $Backups -File -Filter '*.json' | Sort-Object LastWriteTime -Descending | ForEach-Object {
      '{"name":' + (Get-JsonString $_.Name) + ',"size":' + $_.Length + ',"time":' + (Get-UnixMs $_.LastWriteTime) + '}' })
    Send-Json $stream ('[' + ($items -join ',') + ']')
    return
  }
  if ($path.StartsWith('/api/backups/') -and $m -eq 'GET') {
    $name = $path.Substring(13)
    $fp = Join-Path $Backups $name
    if ($name -notmatch $NameRe -or -not (Test-Path -LiteralPath $fp -PathType Leaf)) { Send-Text $stream 404 'Not found'; return }
    Send-File $stream $req $fp 'no-store'
    return
  }
  if ($path -eq '/api/open-folder' -and $m -eq 'POST') {
    $folder = $Backups
    if ($req.Query['which'] -eq 'portal') { $folder = $Data }
    Start-Process explorer.exe -ArgumentList ('"' + $folder + '"')
    Send-Json $stream '{"ok":true}'
    return
  }
  Send-Text $stream 404 'unknown api'
}

function Invoke-Route($stream, $req, [bool]$isLocal) {
  $path = $req.Path
  if ($path -eq '/api/ping') { Send-Text $stream 200 'devportals'; return }
  if ($path.StartsWith('/api/')) {
    if (-not $isLocal) { Send-Text $stream 403 'forbidden'; return }
    Invoke-Api $stream $req
    return
  }
  if ($path -eq '/studio') { Send-Bytes $stream 302 $null 'text/plain' @{ 'Location' = '/studio/' } $false; return }
  if ($path.StartsWith('/studio/')) {
    if (-not $isLocal) {
      Send-Text $stream 403 "<!doctype html><meta charset=utf-8><body style='font-family:sans-serif;background:#111;color:#eee;padding:40px'><h2>DevPortals</h2><p>Le studio n'est accessible que sur l'ordinateur du developpeur.<br>The studio is only available on the developer's computer.</p><p><a style='color:#a78bfa' href='/'>Portail / Portal</a></p>" 'text/html; charset=utf-8'
      return
    }
    $f = Resolve-Static $Studio $path.Substring(8)
    if ($f) { Send-File $stream $req $f 'no-cache' } else { Send-Text $stream 404 'Not found' }
    return
  }
  if ($path -eq '/shared/md.js') { Send-File $stream $req $MdJs 'no-cache'; return }
  if ($path.StartsWith('/data/')) {
    $f = Resolve-Static $Data $path.Substring(6)
    if (-not $f) { Send-Text $stream 404 'Not found'; return }
    $cache = 'public, max-age=31536000, immutable'
    if ($f.EndsWith('.json')) { $cache = 'no-cache' }
    Send-File $stream $req $f $cache
    return
  }
  $f = Resolve-Static $Portal $path
  if ($f) { Send-File $stream $req $f 'no-cache' } else { Send-Text $stream 404 'Not found' }
}

function Invoke-Client($client) {
  $client.NoDelay = $true
  $stream = $client.GetStream()
  $stream.ReadTimeout = 20000
  $req = Read-Request $stream
  if ($null -eq $req) { return }
  if ($req.TooLarge) { Send-Text $stream 413 'too large'; return }
  $remote = $client.Client.RemoteEndPoint.Address
  if ($remote.IsIPv4MappedToIPv6) { $remote = $remote.MapToIPv4() }
  $isLocal = [System.Net.IPAddress]::IsLoopback($remote)
  try {
    Invoke-Route $stream $req $isLocal
  } catch {
    Write-Host ("  ! " + $req.Method + ' ' + $req.Path + ' : ' + $_.Exception.Message) -ForegroundColor DarkYellow
    try { Send-Text $stream 500 ('Erreur serveur : ' + $_.Exception.Message) } catch { }
  }
  if ($req.Path.StartsWith('/api/') -and $req.Path -ne '/api/ping' -and $req.Path -ne '/api/info') { Write-Host ('  ' + $req.Method + ' ' + $req.Path) -ForegroundColor DarkGray }
}

# ---------------- Démarrage ----------------
function Start-Listener([System.Net.IPAddress]$addr, [bool]$dual) {
  $l = New-Object System.Net.Sockets.TcpListener($addr, $Port)
  if ($dual) { $l.Server.DualMode = $true }
  $l.Start()
  return $l
}

$studioUrl = "http://localhost:$Port/studio/"
$listener = $null
$inUse = $false
try {
  $listener = Start-Listener ([System.Net.IPAddress]::IPv6Any) $true
} catch {
  $se = $_.Exception.InnerException
  if ($se -and $se.SocketErrorCode -eq [System.Net.Sockets.SocketError]::AddressAlreadyInUse) { $inUse = $true }
  else {
    try { $listener = Start-Listener ([System.Net.IPAddress]::Any) $false } catch { $inUse = $true }
  }
}

if ($inUse -or $null -eq $listener) {
  $pong = ''
  try { $pong = (New-Object System.Net.WebClient).DownloadString("http://127.0.0.1:$Port/api/ping") } catch { }
  if ($pong -eq 'devportals') {
    Write-Host "DevPortals est deja lance. Ouverture de $studioUrl" -ForegroundColor Green
    if (-not $NoBrowser) { Start-Process $studioUrl }
    exit 0
  }
  Write-Host "[ERREUR] Le port $Port est deja utilise par un autre programme." -ForegroundColor Red
  Write-Host "Modifie la ligne 'set PORT=$Port' dans DevPortals.bat (garde ensuite toujours le meme port pour retrouver tes projets)."
  exit 1
}

Write-Host ''
Write-Host '  ==============================================' -ForegroundColor DarkGray
Write-Host '   DevPortals - serveur local actif' -ForegroundColor White
Write-Host '  ==============================================' -ForegroundColor DarkGray
Write-Host "   Studio (ce PC)    : $studioUrl" -ForegroundColor Cyan
Write-Host "   Portail (ce PC)   : http://localhost:$Port/"
foreach ($u in Get-LanUrls) { Write-Host "   Portail (reseau)  : $u" -ForegroundColor Green }
Write-Host '   Laisse cette fenetre ouverte. Ferme-la (ou Ctrl+C) pour arreter.'
Write-Host '   Si Windows le demande, autorise l''acces sur les reseaux prives.' -ForegroundColor DarkGray
Write-Host ''
if (-not $NoBrowser) { Start-Process $studioUrl }

# Boucle principale : les connexions inactives (préconnexions du navigateur) ne bloquent pas le serveur
$waiting = New-Object System.Collections.ArrayList
try {
  while ($true) {
    while ($listener.Pending()) {
      $c = $listener.AcceptTcpClient()
      [void]$waiting.Add(@{ Client = $c; Since = [DateTime]::UtcNow })
    }
    $worked = $false
    for ($i = $waiting.Count - 1; $i -ge 0; $i--) {
      $it = $waiting[$i]
      $c = $it.Client
      $ready = $false
      try { $ready = ($c.Available -gt 0) } catch { $ready = $false }
      if ($ready) {
        $waiting.RemoveAt($i)
        $worked = $true
        try { Invoke-Client $c } catch { } finally { try { $c.Close() } catch { } }
      } elseif (([DateTime]::UtcNow - $it.Since).TotalSeconds -gt 30) {
        $waiting.RemoveAt($i)
        try { $c.Close() } catch { }
      }
    }
    if (-not $worked) { Start-Sleep -Milliseconds 10 }
  }
} finally {
  $listener.Stop()
}
