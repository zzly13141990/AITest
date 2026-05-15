---
name: "api-quick-dev"
description: "接口联调快速开发，提供API设计、Mock数据、请求封装、联调工具等。Invoke when developing APIs, building frontend API layers, or doing API integration."
---

# API Quick Dev - 接口联调快速开发

## Description

此技能用于API快速开发和联调，提供API设计、Mock数据、请求封装、联调工具等，提升API开发效率。

## Usage Scenario

- API接口开发
- 前端API层封装
- 接口联调
- Mock数据开发
- API文档管理

## Instructions

### 1. API设计规范

#### RESTful API设计原则

```
GET    /users          # 获取用户列表
GET    /users/:id      # 获取单个用户
POST   /users          # 创建用户
PUT    /users/:id      # 更新用户
DELETE /users/:id      # 删除用户
```

#### 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1234567890
}
```

#### 统一错误格式

```json
{
  "code": 400,
  "message": "参数错误",
  "errors": [
    {
      "field": "email",
      "message": "邮箱格式不正确"
    }
  ],
  "timestamp": 1234567890
}
```

#### 状态码规范

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

### 2. 前端API封装

#### Axios 请求封装

```typescript
// src/api/request.ts
import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

interface ResponseData<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加认证token
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ResponseData>) => {
    const { code, message, data } = response.data;

    if (code === 200) {
      return data;
    } else {
      // 业务错误处理
      console.error(message);
      return Promise.reject(new Error(message));
    }
  },
  (error) => {
    // HTTP错误处理
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // 未授权，跳转到登录
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('没有权限访问');
          break;
        case 404:
          console.error('请求的资源不存在');
          break;
        case 500:
          console.error('服务器错误');
          break;
        default:
          console.error(data?.message || '请求失败');
      }
    } else if (error.request) {
      console.error('网络错误');
    } else {
      console.error('请求配置错误');
    }

    return Promise.reject(error);
  }
);

// 请求方法封装
export const http = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.get(url, config);
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.post(url, data, config);
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.put(url, data, config);
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.delete(url, config);
  },
};

export default request;
```

#### API模块封装

```typescript
// src/api/index.ts
import { http } from './request';

// 类型定义
export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  status: number;
  createdAt: string;
}

export interface PageParams {
  page?: number;
  size?: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

// 用户API
export const userApi = {
  // 获取用户列表
  getList(params: PageParams & { keyword?: string }) {
    return http.get<PageResult<User>>('/users', { params });
  },

  // 获取用户详情
  getDetail(id: number) {
    return http.get<User>(`/users/${id}`);
  },

  // 创建用户
  create(data: Partial<User>) {
    return http.post<User>('/users', data);
  },

  // 更新用户
  update(id: number, data: Partial<User>) {
    return http.put<User>(`/users/${id}`, data);
  },

  // 删除用户
  delete(id: number) {
    return http.delete<void>(`/users/${id}`);
  },
};

// 认证API
export const authApi = {
  // 登录
  login(data: { username: string; password: string }) {
    return http.post<{ token: string; user: User }>('/auth/login', data);
  },

  // 登出
  logout() {
    return http.post<void>('/auth/logout');
  },

  // 获取当前用户
  getCurrentUser() {
    return http.get<User>('/auth/me');
  },
};
```

#### 在组件中使用

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, User } from '../api';

function UserList() {
  const queryClient = useQueryClient();

  // 获取用户列表
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getList({ page: 1, size: 20 }),
  });

  // 删除用户
  const deleteMutation = useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: () => {
      // 刷新列表
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败</div>;

  return (
    <div>
      <h1>用户列表</h1>
      <ul>
        {data?.list.map((user: User) => (
          <li key={user.id}>
            {user.username}
            <button onClick={() => deleteMutation.mutate(user.id)}>
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 3. Mock数据方案

#### Mock Service Worker (MSW)

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  // 用户列表
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json({
      code: 200,
      message: 'success',
      data: {
        list: [
          { id: 1, username: 'user1', email: 'user1@example.com' },
          { id: 2, username: 'user2', email: 'user2@example.com' },
        ],
        total: 2,
        page: 1,
        size: 20,
      },
      timestamp: Date.now(),
    }));
  }),

  // 用户详情
  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.json({
      code: 200,
      message: 'success',
      data: {
        id: Number(id),
        username: `user${id}`,
        email: `user${id}@example.com`,
        status: 1,
        createdAt: '2024-01-01T00:00:00Z',
      },
      timestamp: Date.now(),
    }));
  }),

  // 创建用户
  rest.post('/api/users', (req, res, ctx) => {
    return res(ctx.json({
      code: 200,
      message: 'success',
      data: { id: 3, ...req.body },
      timestamp: Date.now(),
    }));
  }),
];
```

```typescript
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

```typescript
// src/main.tsx
if (import.meta.env.DEV) {
  const { worker } = await import('./mocks/browser');
  worker.start();
}
```

### 4. 快速开发工具

#### API文档生成

```java
// SpringDoc OpenAPI配置
@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API文档")
                        .version("1.0")
                        .description("项目API文档"));
    }
}
```

#### 联调工具推荐

1. **Postman** - API测试工具
2. **Apifox** - 接口设计、文档、测试一体化
3. **Insomnia** - REST/GraphQL客户端
4. **Thunder Client** - VSCode扩展

### 5. 类型安全API

#### 使用TypeScript生成类型

```typescript
// src/api/types.ts
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  status: number;
  createdAt: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  phone?: string;
  status?: number;
}
```

#### 泛型API函数

```typescript
// src/api/typedRequest.ts
import { http } from './request';

interface ApiEndpoint<Request, Response> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
}

function createApi<Request, Response>(
  endpoint: ApiEndpoint<Request, Response>
) {
  return (data?: Request, params?: Record<string, any>) => {
    switch (endpoint.method) {
      case 'GET':
        return http.get<Response>(endpoint.path, { params });
      case 'POST':
        return http.post<Response>(endpoint.path, data);
      case 'PUT':
        return http.put<Response>(endpoint.path, data);
      case 'DELETE':
        return http.delete<Response>(endpoint.path);
      default:
        throw new Error('不支持的方法');
    }
  };
}

// 使用示例
export const createUser = createApi<UserCreateRequest, User>({
  method: 'POST',
  path: '/users',
});

export const getUser = createApi<void, User>({
  method: 'GET',
  path: '/users/:id',
});
```

## Examples

### 完整API开发流程示例

#### 1. 设计API接口

```
POST /api/users
Request:
{
  "username": "string",
  "email": "string",
  "password": "string"
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "string",
    "email": "string"
  }
}
```

#### 2. 创建Mock数据

```typescript
// handlers.ts
rest.post('/api/users', (req, res, ctx) => {
  return res(ctx.json({
    code: 200,
    message: 'success',
    data: { id: 1, ...req.body },
    timestamp: Date.now(),
  }));
}),
```

#### 3. 封装API调用

```typescript
// api/user.ts
export const createUser = (data: UserCreateRequest) =>
  http.post<User>('/users', data);
```

#### 4. 前端使用

```tsx
const createMutation = useMutation({
  mutationFn: createUser,
  onSuccess: (data) => {
    console.log('创建成功:', data);
  },
});

return (
  <button onClick={() => createMutation.mutate({
    username: 'test',
    email: 'test@example.com',
    password: '123456',
  })}>
    创建用户
  </button>
);
```
