@echo off
REM ================================================================
REM  Comic Reader - Windows Defender Firewall Port 7891 Configurator
REM ================================================================

REM Check for administrative privileges and auto-elevate
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    powershell -Command "Start-Process cmd -ArgumentList '/c %~s0' -Verb RunAs"
    exit /b
)

echo.
echo ================================================================
echo  Configuring Windows Firewall for Comic Reader (Port 7891)...
echo ================================================================
echo.

netsh advfirewall firewall delete rule name="ComicReader-7891" >nul 2>&1
netsh advfirewall firewall add rule name="ComicReader-7891" dir=in action=allow protocol=TCP localport=7891 profile=any description="Allow Comic Reader IPv4 and IPv6 access"

echo.
if %errorlevel% equ 0 (
    echo [SUCCESS] Windows Firewall has allowed port 7891!
    echo [SUCCESS] Public IPv6 and LAN devices can now access the server.
) else (
    echo [ERROR] Failed to add firewall rule. Please run as Administrator.
)

echo.
pause
