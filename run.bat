@echo off
cd /d "%~dp0"

py --version >nul 2>&1
if %errorlevel% equ 0 (
    py run.py
    goto end
)

python --version >nul 2>&1
if %errorlevel% equ 0 (
    python run.py
    goto end
)

echo [ERROR] Python is not found.
echo Please install Python 3.9+ and check 'Add python.exe to PATH'.
pause

:end
