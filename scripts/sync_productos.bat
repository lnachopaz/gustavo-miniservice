@echo off
REM ─── Sincronización diaria de productos a Supabase ────────────────────────
REM Lo ejecuta el Programador de Tareas de Windows.
REM
REM La clave se define acá porque el Programador de Tareas NO hereda las
REM variables de entorno de una sesión interactiva de PowerShell: lo que
REM definas con $env:... en una ventana no existe para la tarea programada.
REM
REM Alternativa si no querés la clave en este archivo: definirla como variable
REM de entorno del sistema (Panel de control → Sistema → Variables de entorno)
REM y borrar la línea de abajo.

set SUPABASE_SERVICE_KEY=PONER_SERVICE_ROLE_KEY_AQUI

cd /d "%~dp0"
echo [%date% %time%] Iniciando sincronizacion de productos...

python sync_productos.py

if errorlevel 1 (
    echo [%date% %time%] ERROR en la sincronizacion. Ver sync_log.txt
    exit /b 1
)

echo [%date% %time%] Sincronizacion completada.
exit /b 0
