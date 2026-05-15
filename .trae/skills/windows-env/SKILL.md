---
name: "windows-env"
description: "Windows开发环境运维，包括环境配置、工具安装、问题排查等。Invoke when setting up dev environment, installing tools, or troubleshooting Windows issues."
---

# Windows Env - Windows开发环境运维

## Description

此技能用于Windows开发环境配置和运维，包括环境配置、工具安装、问题排查等，确保开发环境稳定可用。

## Usage Scenario

- 新环境搭建
- 开发工具安装
- 环境问题排查
- 依赖管理
- 性能优化

## Instructions

### 1. 基础环境配置

#### Chocolatey 包管理器

```powershell
# 安装Chocolatey (管理员权限)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 常用工具安装
choco install git -y
choco install nodejs-lts -y
choco install jdk17 -y
choco install maven -y
choco install vscode -y
choco install docker-desktop -y
choco install mysql -y
choco install postgresql -y
choco install redis-64 -y
```

#### Scoop 包管理器

```powershell
# 安装Scoop
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# 添加bucket
scoop bucket add main
scoop bucket add extras
scoop bucket add versions

# 安装工具
scoop install git
scoop install nodejs-lts
scoop install openjdk17
scoop install maven
scoop install vscode
scoop install docker
```

#### Winget 包管理器

```powershell
# Windows 11自带，Windows 10需要安装
winget install Git.Git
winget install OpenJS.NodeJS.LTS
winget install Microsoft.OpenJDK.17
winget install Apache.Maven
winget install Microsoft.VisualStudioCode
winget install Docker.DockerDesktop
```

### 2. Node.js 开发环境

#### nvm-windows 版本管理

```powershell
# 安装nvm-windows
# 下载: https://github.com/coreybutler/nvm-windows/releases

# 使用nvm安装Node.js
nvm install 18.18.0
nvm use 18.18.0
nvm install 20.9.0
nvm use 20.9.0
nvm list
```

#### Node.js 环境配置

```powershell
# 配置npm镜像
npm config set registry https://registry.npmmirror.com
npm config list

# 配置全局安装路径
npm config set prefix "D:\npm-global"
npm config set cache "D:\npm-cache"

# 常用npm包安装
npm install -g pnpm
npm install -g yarn
npm install -g @vue/cli
npm install -g create-react-app
npm install -g typescript
```

#### pnpm 配置

```powershell
# 安装pnpm
npm install -g pnpm

# 配置pnpm
pnpm config set registry https://registry.npmmirror.com
pnpm setup
```

### 3. Java 开发环境

#### JDK 安装配置

```powershell
# 配置JAVA_HOME
$env:JAVA_HOME = "D:\Program Files\Java\jdk-17"
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'D:\Program Files\Java\jdk-17', 'User')

# 配置PATH
$path = [System.Environment]::GetEnvironmentVariable('PATH', 'User')
$path = "$env:JAVA_HOME\bin;$path"
[System.Environment]::SetEnvironmentVariable('PATH', $path, 'User')

# 验证
java -version
javac -version
```

#### Maven 配置

```powershell
# 配置MAVEN_HOME
$env:MAVEN_HOME = "D:\Program Files\apache-maven-3.9.x"
[System.Environment]::SetEnvironmentVariable('MAVEN_HOME', 'D:\Program Files\apache-maven-3.9.x', 'User')

# 配置PATH
$path = [System.Environment]::GetEnvironmentVariable('PATH', 'User')
$path = "$env:MAVEN_HOME\bin;$path"
[System.Environment]::SetEnvironmentVariable('PATH', $path, 'User')

# 验证
mvn -version
```

#### Maven 配置文件 (settings.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0">
  <!-- 本地仓库 -->
  <localRepository>D:/maven-repo</localRepository>

  <!-- 镜像配置 -->
  <mirrors>
    <mirror>
      <id>aliyun</id>
      <mirrorOf>*</mirrorOf>
      <name>Aliyun Maven</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
  </mirrors>

  <!-- JDK配置 -->
  <profiles>
    <profile>
      <id>jdk-17</id>
      <activation>
        <activeByDefault>true</activeByDefault>
        <jdk>17</jdk>
      </activation>
      <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <maven.compiler.compilerVersion>17</maven.compiler.compilerVersion>
      </properties>
    </profile>
  </profiles>
</settings>
```

### 4. 数据库环境

#### MySQL 安装配置

```powershell
# 使用Docker安装MySQL
docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=dev_db mysql:8.0

# 或使用Chocolatey安装
choco install mysql -y

# 启动MySQL服务
net start mysql80
```

#### PostgreSQL 安装配置

```powershell
# 使用Docker安装PostgreSQL
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dev_db postgres:15

# 或使用Chocolatey安装
choco install postgresql -y
```

#### Redis 安装配置

```powershell
# 使用Docker安装Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine

# 或使用Chocolatey安装
choco install redis-64 -y

# 启动Redis
redis-server
```

### 5. Docker 环境

#### Docker Desktop 安装

```powershell
# 下载安装Docker Desktop
# https://www.docker.com/products/docker-desktop/

# 验证安装
docker version
docker-compose version

# 配置Docker镜像加速
# Docker Desktop -> Settings -> Docker Engine
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
```

#### 常用Docker命令

```powershell
# 查看运行中的容器
docker ps

# 查看所有容器
docker ps -a

# 启动/停止/重启容器
docker start container-name
docker stop container-name
docker restart container-name

# 查看容器日志
docker logs -f container-name

# 进入容器
docker exec -it container-name bash

# 构建镜像
docker build -t image-name:tag .

# 运行容器
docker run -d --name container-name -p 8080:8080 image-name:tag

# Docker Compose
docker-compose up -d
docker-compose down
docker-compose logs -f
```

### 6. Git 环境配置

#### Git 安装和配置

```powershell
# 安装Git
choco install git -y

# 配置用户信息
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 配置默认分支名
git config --global init.defaultBranch main

# 配置编辑器
git config --global core.editor "code --wait"

# 配置换行符处理
git config --global core.autocrlf true

# 查看配置
git config --list
```

#### SSH 密钥配置

```powershell
# 生成SSH密钥
ssh-keygen -t ed25519 -C "your@email.com"

# 启动SSH代理
Start-Service ssh-agent
ssh-add ~/.ssh/id_ed25519

# 复制公钥
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard

# 测试连接
ssh -T git@github.com
```

### 7. IDE 和编辑器配置

#### VSCode 配置

```powershell
# 安装VSCode
choco install vscode -y

# 常用扩展安装
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-python.python
code --install-extension vscjava.vscode-java-pack
code --install-extension ms-azuretools.vscode-docker
code --install-extension eamodio.gitlens
code --install-extension SonarSource.sonarlint-vscode
```

#### VSCode settings.json

```json
{
  "editor.tabSize": 2,
  "editor.formatOnSave": true,
  "files.autoSave": "onFocusChange",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[java]": {
    "editor.defaultFormatter": "redhat.java"
  },
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-17",
      "path": "D:\\Program Files\\Java\\jdk-17",
      "default": true
    }
  ]
}
```

### 8. 环境变量配置

#### PowerShell 配置文件

```powershell
# 编辑配置文件
notepad $PROFILE

# 如果文件不存在，创建它
if (!(Test-Path -Path $PROFILE)) {
  New-Item -ItemType File -Path $PROFILE -Force
}

# 配置内容示例
Set-Alias ll 'Get-ChildItem'
Set-Alias gs 'Get-Service'
Set-Alias gcm 'Get-Command'
Set-Alias np 'notepad'

function .. { cd .. }
function ... { cd ../.. }

function cdl { param($path) Set-Location $path; ll }

# 环境变量
$env:JAVA_HOME = "D:\Program Files\Java\jdk-17"
$env:MAVEN_HOME = "D:\Program Files\apache-maven-3.9.x"
$env:NODE_PATH = "$env:APPDATA\npm"
$env:PATH = "$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin;$env:PATH"
```

### 9. 常见问题排查

#### 问题1: 端口被占用

```powershell
# 查看端口占用
netstat -ano | findstr :3000

# 查看进程详情
tasklist | findstr 12345

# 结束进程
taskkill /PID 12345 /F
```

#### 问题2: 权限问题

```powershell
# 以管理员身份运行PowerShell
# 右键PowerShell -> 以管理员身份运行

# 设置执行策略
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 问题3: 网络代理问题

```powershell
# 配置代理
$env:HTTP_PROXY = "http://proxy-server:port"
$env:HTTPS_PROXY = "http://proxy-server:port"

# Git代理配置
git config --global http.proxy http://proxy-server:port
git config --global https.proxy http://proxy-server:port

# npm代理配置
npm config set proxy http://proxy-server:port
npm config set https-proxy http://proxy-server:port
```

#### 问题4: 依赖安装慢

```powershell
# 使用国内镜像源
npm config set registry https://registry.npmmirror.com
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

### 10. 性能优化

#### Windows 性能优化

```powershell
# 清理临时文件
Remove-Item $env:TEMP\* -Recurse -Force

# 优化启动项
# Task Manager -> Startup

# 关闭不需要的Windows功能
# Control Panel -> Programs -> Turn Windows features on or off
```

#### Git 性能优化

```powershell
# 配置大文件处理
git config --global core.autocrlf true
git config --global core.longpaths true
git config --global core.filemode false

# 启用文件系统缓存
git config --global core.fscache true
```

## Examples

### 完整环境搭建脚本示例

```powershell
# setup-dev-env.ps1

Write-Host "开始搭建开发环境..." -ForegroundColor Green

# 1. 安装Chocolatey
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "安装Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# 2. 安装开发工具
Write-Host "安装开发工具..." -ForegroundColor Yellow
choco install git -y
choco install nodejs-lts -y
choco install jdk17 -y
choco install maven -y
choco install vscode -y
choco install docker-desktop -y

# 3. 配置Git
Write-Host "配置Git..." -ForegroundColor Yellow
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 4. 配置npm
Write-Host "配置npm..." -ForegroundColor Yellow
npm config set registry https://registry.npmmirror.com
npm install -g pnpm

Write-Host "开发环境搭建完成！" -ForegroundColor Green
```
