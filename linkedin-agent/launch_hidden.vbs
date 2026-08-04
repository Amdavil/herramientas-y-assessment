' Lanza run_agent.bat sin ventana visible.
' Evita que el agente muera si alguien cierra la ventana de consola.
' Propaga el codigo de salida para que Task Scheduler pueda reintentar si falla.
Set shell = CreateObject("WScript.Shell")
code = shell.Run("""C:\Users\User\OneDrive\Documentos\Claude-Practica\linkedin-agent\run_agent.bat""", 0, True)
WScript.Quit code
