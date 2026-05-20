@echo off
chcp 65001 >nul
title QueryTool - Production

cd /d "%~dp0"

:: ========================================
::   生产环境启动脚本 (基于项目自带 JRE)
::   参考: README.md "使用本地 JRE 编译（Windows）"
:: ========================================

:: 设置项目自带的 JRE 环境
set JAVA_HOME=%CD%\jre
set PATH=%JAVA_HOME%\bin;%PATH%

:: JVM 参数 (生产环境)
set JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200

:: 检查 JRE 是否存在
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo [错误] 未找到 JRE: %JAVA_HOME%
    echo 请确认 jre\ 目录存在且包含 java.exe
    pause
    exit /b 1
)

:: 检查 jar 包是否存在
if not exist "target\query-tool-1.0.0.jar" (
    echo [错误] 未找到 jar 包: target\query-tool-1.0.0.jar
    echo 请先执行构建:
    echo   set JAVA_HOME=%CD%\jre
    echo   set PATH=%JAVA_HOME%\bin;%%PATH%%
    echo   mvn clean package -DskipTests
    pause
    exit /b 1
)

echo ========================================
echo   QueryTool - Production Mode
echo ========================================
echo [JRE]     %JAVA_HOME%
echo [JAR]     target\query-tool-1.0.0.jar
echo [端口]    8999
echo [JVM]     %JAVA_OPTS%
echo [日志]    logs\query-tool.log
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

:: 创建日志目录
if not exist "logs" mkdir logs

:: 启动服务 (前台运行，日志同时输出到控制台和文件)
%JAVA_HOME%\bin\java %JAVA_OPTS% -jar target\query-tool-1.0.0.jar 2>&1 | tee logs\query-tool.log

if %errorlevel% neq 0 (
    echo.
    echo [错误] 服务异常退出，退出码: %errorlevel%
    echo 详细日志请查看: logs\query-tool.log
    pause
)