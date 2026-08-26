@echo off
chcp 65001 >nul
title 漫画阅读器 - Windows 防火墙一键放行配置
echo ================================================================
echo      本地漫画阅读器 - Windows 防火墙端口放行工具 (7891)
echo ================================================================
echo.
echo 正在检查并添加防火墙入站规则...
echo.

:: 尝试添加防火墙入站规则
netsh advfirewall firewall delete rule name="ComicReader-7891" >nul 2>&1
netsh advfirewall firewall add rule name="ComicReader-7891" dir=in action=allow protocol=TCP localport=7891 profile=any description="Allow Comic Reader IPv4 and IPv6 inbound access" >nul 2>&1

if %errorlevel% equ 0 (
    echo [✓] 成功！Windows 防火墙已成功放行 7891 端口！
    echo [✓] 公网 IPv6 与局域网设备现在可以直接连入漫画阅读器。
    echo.
    echo ----------------------------------------------------------------
    echo 💡 路由器 IPv6 防火墙检查提示：
    echo 若手机 5G 仍提示“响应时间过长 (ERR_CONNECTION_TIMED_OUT)”，
    echo 请登录您的家庭 Wi-Fi 路由器后台（如 192.168.1.1 或 192.168.31.1），
    echo 在【安全设置 / IPv6 设置】中关闭【IPv6 防火墙】或放行 7891 端口。
    echo ----------------------------------------------------------------
) else (
    echo [×] 配置失败：需要管理员权限。
    echo.
    echo 👉 请【右键点击此文件 allow_firewall.bat】，选择【以管理员身份运行】！
)

echo.
pause
