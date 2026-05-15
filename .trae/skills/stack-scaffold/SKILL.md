---
name: "stack-scaffold"
description: "全栈项目脚手架，提供项目初始化、模板生成、最佳实践等。Invoke when starting new projects, creating project templates, or setting up project structure."
---

# Stack Scaffold - 全栈项目脚手架

## Description

此技能用于全栈项目脚手架搭建，提供项目初始化、模板生成、最佳实践等，快速启动新项目。

## Usage Scenario

- 新项目初始化
- 项目模板创建
- 架构设计
- 技术选型
- 项目规范制定

## Instructions

### 1. 前端项目脚手架

#### React + TypeScript + Vite 项目

```bash
# 创建项目
npm create vite@latest my-app -- --template react-ts
cd my-app

# 安装依赖
npm install

# 配置基础依赖
npm install axios react-router-dom
npm install -D @types/react-router-dom
```

#### 推荐项目结构

```
frontend/
├── public/                  # 静态资源
│   └── favicon.ico
├── src/
│   ├── api/                 # API接口
│   │   ├── request.ts       # 请求封装
│   │   └── index.ts         # API模块
│   ├── assets/              # 资源文件
│   │   ├── images/
│   │   └── styles/
│   ├── components/          # 通用组件
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── Table/
│   ├── hooks/               # 自定义Hooks
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   └── useTable.ts
│   ├── pages/               # 页面组件
│   │   ├── Home/
│   │   ├── Login/
│   │   └── Dashboard/
│   ├── router/              # 路由配置
│   │   └── index.tsx
│   ├── stores/              # 状态管理
│   │   ├── authStore.ts
│   │   └── userStore.ts
│   ├── types/               # 类型定义
│   │   ├── api.ts
│   │   └── user.ts
│   ├── utils/               # 工具函数
│   │   ├── request.ts
│   │   ├── storage.ts
│   │   └── validate.ts
│   ├── App.tsx              # 根组件
│   ├── main.tsx             # 入口文件
│   └── vite-env.d.ts        # Vite类型声明
├── .env                     # 环境变量
├── .env.development
├── .env.production
├── .eslintrc.cjs            # ESLint配置
├── .prettierrc              # Prettier配置
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

#### 基础配置文件

```json
// package.json
{
  "name": "my-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "prettier": "^3.1.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 2. 后端项目脚手架

#### Spring Boot + Java 项目

```bash
# 使用Spring Initializr创建项目
# https://start.spring.io/
# 选择: Maven Project, Spring Boot 3.2.x, Java 17
# 依赖: Spring Web, Spring Data JPA, MySQL Driver, Lombok, Validation, SpringDoc OpenAPI
```

#### 推荐项目结构

```
backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/project/
│   │   │       ├── ProjectApplication.java    # 启动类
│   │   │       ├── config/                   # 配置类
│   │   │       │   ├── MybatisConfig.java
│   │   │       │   ├── RedisConfig.java
│   │   │       │   ├── SwaggerConfig.java
│   │   │       │   └── CorsConfig.java
│   │   │       ├── controller/              # 控制器层
│   │   │       │   ├── UserController.java
│   │   │       │   └── OrderController.java
│   │   │       ├── service/                 # 服务层
│   │   │       │   ├── UserService.java
│   │   │       │   └── OrderService.java
│   │   │       ├── repository/              # 数据访问层
│   │   │       │   ├── UserRepository.java
│   │   │       │   └── OrderRepository.java
│   │   │       ├── entity/                  # 实体类
│   │   │       │   ├── User.java
│   │   │       │   └── Order.java
│   │   │       ├── dto/                     # 数据传输对象
│   │   │       │   ├── UserCreateRequest.java
│   │   │       │   ├── UserResponse.java
│   │   │       │   └── ApiResponse.java
│   │   │       ├── common/                  # 公共类
│   │   │       │   ├── exception/
│   │   │       │   │   ├── BusinessException.java
│   │   │       │   │   └── GlobalExceptionHandler.java
│   │   │       │   ├── annotation/
│   │   │       │   └── constant/
│   │   │       └── utils/                   # 工具类
│   │   │           ├── JwtUtil.java
│   │   │           └── PasswordUtil.java
│   │   └── resources/
│   │       ├── application.yml              # 配置文件
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       ├── static/
│   │       └── templates/
│   └── test/
│       └── java/
│           └── com/project/
│               ├── service/
│               └── controller/
└── pom.xml
```

#### pom.xml 配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>com.project</groupId>
    <artifactId>my-project</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>My Project</name>
    <description>Demo Project</description>
    
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- Spring Data JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        
        <!-- Spring Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <!-- MySQL Driver -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <!-- H2 Database (for test) -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- SpringDoc OpenAPI (Swagger) -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.3.0</version>
        </dependency>
        
        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.11.5</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        
        <!-- Spring Boot Starter Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

#### application.yml 配置

```yaml
spring:
  application:
    name: my-project
  
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/my_db?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: root
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQLDialect

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html

server:
  port: 8080
  servlet:
    context-path: /api
```

### 3. 全栈项目结构

#### 完整项目结构

```
my-project/
├── frontend/                  # 前端项目
├── backend/                   # 后端项目
├── docs/                      # 文档
│   ├── architecture.md       # 架构文档
│   ├── database.md           # 数据库文档
│   └── api.md                # API文档
├── docker/                    # Docker相关
│   ├── docker-compose.yml
│   └── nginx.conf
├── scripts/                   # 脚本
│   ├── setup.sh
│   ├── build.sh
│   └── deploy.sh
├── .gitignore
├── README.md
└── docker-compose.yml
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: my_db
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./docker/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: backend
    ports:
      - "8080:8080"
    depends_on:
      - mysql
      - redis
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/my_db
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: root
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  mysql-data:
  redis-data:

networks:
  app-network:
    driver: bridge
```

### 4. 快速启动脚本

#### setup.ps1 (Windows)

```powershell
# setup.ps1

Write-Host "=== 项目初始化 ===" -ForegroundColor Green

# 检查Node.js
Write-Host "检查Node.js..." -ForegroundColor Yellow
node -v
if ($LASTEXITCODE -ne 0) {
  Write-Host "请先安装Node.js" -ForegroundColor Red
  exit 1
}

# 检查Java
Write-Host "检查Java..." -ForegroundColor Yellow
java -version
if ($LASTEXITCODE -ne 0) {
  Write-Host "请先安装JDK 17" -ForegroundColor Red
  exit 1
}

# 检查Maven
Write-Host "检查Maven..." -ForegroundColor Yellow
mvn -version
if ($LASTEXITCODE -ne 0) {
  Write-Host "请先安装Maven" -ForegroundColor Red
  exit 1
}

# 安装前端依赖
Write-Host "安装前端依赖..." -ForegroundColor Yellow
cd frontend
npm install
if ($LASTEXITCODE -ne 0) {
  Write-Host "前端依赖安装失败" -ForegroundColor Red
  exit 1
}
cd ..

# 编译后端
Write-Host "编译后端..." -ForegroundColor Yellow
cd backend
mvn clean install -DskipTests
if ($LASTEXITCODE -ne 0) {
  Write-Host "后端编译失败" -ForegroundColor Red
  exit 1
}
cd ..

Write-Host "=== 项目初始化完成 ===" -ForegroundColor Green
Write-Host "启动项目:" -ForegroundColor Cyan
Write-Host "  前端: cd frontend; npm run dev"
Write-Host "  后端: cd backend; mvn spring-boot:run"
```

## Examples

### 完整项目创建流程

```powershell
# 1. 创建项目根目录
mkdir my-project
cd my-project

# 2. 初始化Git
git init

# 3. 创建前端项目
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install axios react-router-dom
npm install -D @types/react-router-dom
# ... 配置项目结构

# 4. 创建后端项目
# 使用Spring Initializr创建并配置
# ...

# 5. 创建Docker配置
# ... docker-compose.yml

# 6. 创建文档
mkdir docs
# ... 文档内容

# 7. 创建README
# ... README.md
```
