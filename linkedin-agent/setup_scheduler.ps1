# setup_scheduler.ps1
# Registra la tarea diaria en Windows Task Scheduler
# Ejecutar UNA VEZ como administrador: .\setup_scheduler.ps1

$ProjectDir = "C:\Users\User\OneDrive\Documentos\Claude-Practica\linkedin-agent"
$BatFile    = "$ProjectDir\run_agent.bat"
$LogFile    = "$ProjectDir\logs\agent.log"
$TaskName   = "LinkedInDailyPostAgent"

# Crear carpeta de logs si no existe
New-Item -ItemType Directory -Path "$ProjectDir\logs" -Force | Out-Null

# Accion: wscript corre el .bat SIN VENTANA (via launch_hidden.vbs).
# Con cmd.exe directo aparece una consola visible que, si alguien la cierra,
# mata el agente a mitad de publicacion (exit 0xC000013A).
$Action = New-ScheduledTaskAction `
    -Execute "wscript.exe" `
    -Argument "`"$ProjectDir\launch_hidden.vbs`"" `
    -WorkingDirectory $ProjectDir

# Trigger: todos los dias laborables a las 9:00 AM
$Trigger = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday `
    -At "09:00AM"

# Configuracion: correr si se perdio el horario, reintentar hasta 3 veces si falla
$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 10)

# Registrar (o actualizar si ya existe)
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Tarea anterior eliminada."
}

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "Genera y publica un post diario en LinkedIn usando Claude AI"

# Deshabilitar restriccion de bateria (permite correr en laptop sin corriente)
$task = Get-ScheduledTask -TaskName $TaskName
$task.Settings.DisallowStartIfOnBatteries = $false
$task.Settings.StopIfGoingOnBatteries = $false
Set-ScheduledTask -InputObject $task | Out-Null

Write-Host ""
Write-Host "Tarea '$TaskName' registrada exitosamente."
Write-Host "Se ejecutara de lunes a viernes a las 9:00 AM."
Write-Host "Logs en: $LogFile"
Write-Host ""
Write-Host "Para probarla manualmente:"
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'"
Write-Host ""
Write-Host "Para ver los logs:"
Write-Host "  Get-Content '$LogFile' -Tail 50"
