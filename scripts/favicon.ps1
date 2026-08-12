# Genera src/app/favicon.ico a partir de la marca hexagonal.
#
# El resto de scripts/ son .mjs; este es PowerShell porque necesita rasterizar
# vectores y Node no sabe hacerlo sin traerse una dependencia de imagen entera
# para un fichero que se regenera una vez al anio. GDI+ ya esta en el sistema.
#
# Solo hace falta ejecutarlo si cambia el logotipo. La fuente de verdad de la
# forma es src/app/icon.svg: si se toca alli, hay que replicarlo en $outer,
# $inner y $spokes de aqui abajo.
#
#   powershell -ExecutionPolicy Bypass -File scripts/favicon.ps1
#
# El de 16px va simplificado a proposito (solo el hexagono exterior): a ese
# tamanio el interior y los radios se funden en una mancha.
Add-Type -AssemblyName System.Drawing

# Geometría del hexágono, en el sistema de 128 del SVG.
$outer = @(@(64,24),@(98.64,44),@(98.64,84),@(64,104),@(29.36,84),@(29.36,44))
$inner = @(@(64,44),@(81.32,54),@(81.32,74),@(64,94),@(46.68,74),@(46.68,54))
$spokes = @(@(64,44,64,24), @(46.68,74,29.36,84), @(81.32,74,98.64,84))

function New-Mark([int]$size, [bool]$simple) {
  $k = $size / 128.0
  $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  # Cuadrado coral con esquinas redondeadas (rx 28 sobre 128).
  $r = [float](28 * $k)
  $w = [float]$size
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc(0, 0, $d, $d, 180, 90)
  $path.AddArc($w - $d, 0, $d, $d, 270, 90)
  $path.AddArc($w - $d, $w - $d, $d, $d, 0, 90)
  $path.AddArc(0, $w - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $coral = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 59, 79))
  $g.FillPath($coral, $path)

  # A 16px el hexágono interior y los radios se convierten en una mancha:
  # a ese tamaño va solo el contorno, que es lo que se sigue reconociendo.
  $stroke = [Math]::Max(1.0, 8 * $k)
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [float]$stroke)
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $toPts = { param($poly) $poly | ForEach-Object { New-Object System.Drawing.PointF([float]($_[0] * $k), [float]($_[1] * $k)) } }
  $g.DrawPolygon($pen, (& $toPts $outer))
  if (-not $simple) {
    $g.DrawPolygon($pen, (& $toPts $inner))
    foreach ($s in $spokes) {
      $g.DrawLine($pen, [float]($s[0]*$k), [float]($s[1]*$k), [float]($s[2]*$k), [float]($s[3]*$k))
    }
  }

  $g.Dispose(); $pen.Dispose(); $coral.Dispose(); $path.Dispose()
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  # La coma es obligatoria: sin ella PowerShell desenrolla el byte[] en la
  # tubería y quien llama recibe un Object[] que BinaryWriter no escribe.
  return ,$ms.ToArray()
}

$imagenes = @(
  @{ size = 16; bytes = (New-Mark 16 $true) },
  @{ size = 32; bytes = (New-Mark 32 $false) },
  @{ size = 48; bytes = (New-Mark 48 $false) }
)

# Contenedor ICO con entradas PNG (soportado desde Windows Vista).
$out = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($out)
$bw.Write([uint16]0)                    # reservado
$bw.Write([uint16]1)                    # tipo: icono
$bw.Write([uint16]$imagenes.Count)

$offset = 6 + (16 * $imagenes.Count)
foreach ($im in $imagenes) {
  $bw.Write([byte]$im.size)
  $bw.Write([byte]$im.size)
  $bw.Write([byte]0)                    # paleta
  $bw.Write([byte]0)                    # reservado
  $bw.Write([uint16]1)                  # planos
  $bw.Write([uint16]32)                 # bits por píxel
  $bw.Write([uint32]$im.bytes.Length)
  $bw.Write([uint32]$offset)
  $offset += $im.bytes.Length
}
foreach ($im in $imagenes) {
  $b = [byte[]]$im.bytes
  $bw.Write($b, 0, $b.Length)
}
$bw.Flush()

$destino = "C:\Users\danie\dev\brandfluence-ai\src\app\favicon.ico"
[IO.File]::WriteAllBytes($destino, $out.ToArray())
$bw.Dispose(); $out.Dispose()

"escrito: $destino"
"tamaños: " + (($imagenes | ForEach-Object { "$($_.size)px=$($_.bytes.Length)B" }) -join "  ")
"total: $((Get-Item $destino).Length) bytes"
