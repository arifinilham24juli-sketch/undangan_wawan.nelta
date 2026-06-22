Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('assets\mempelai.png')
$height = [math]::Round(600 * $img.Height / $img.Width)
$bmp = New-Object System.Drawing.Bitmap($img, 600, $height)
$bmp.Save('assets\mempelai-thumb.jpg', [System.Drawing.Imaging.ImageFormat]::Jpeg)
$img.Dispose()
$bmp.Dispose()
