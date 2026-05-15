---
name: "form-validate"
description: "前端表单强效校验，包括实时校验、错误提示、自定义验证规则等。Invoke when building forms, validating user input, or implementing form logic."
---

# Form Validate - 前端表单强效校验

## Description

此技能用于前端表单校验，提供实时校验、错误提示、自定义验证规则、跨字段验证等功能，确保用户输入数据的正确性。

## Usage Scenario

- 构建表单时
- 验证用户输入
- 实现表单逻辑
- 处理复杂表单验证
- 表单国际化

## Instructions

### 1. 基础验证规则

#### 必填验证
```tsx
const validateRequired = (value: string): string | null => {
  if (!value || value.trim() === '') {
    return '此字段为必填项';
  }
  return null;
};
```

#### 邮箱验证
```tsx
const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '请输入有效的邮箱地址';
  }
  return null;
};
```

#### 手机号验证
```tsx
const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return '请输入有效的手机号';
  }
  return null;
};
```

#### 密码强度验证
```tsx
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return '密码长度至少8位';
  }
  if (!/[A-Z]/.test(password)) {
    return '密码需要包含大写字母';
  }
  if (!/[a-z]/.test(password)) {
    return '密码需要包含小写字母';
  }
  if (!/[0-9]/.test(password)) {
    return '密码需要包含数字';
  }
  return null;
};
```

### 2. React表单验证实现

#### 使用React Hook的表单状态管理

```tsx
import { useState, useCallback } from 'react';

interface FieldState {
  value: string;
  error: string | null;
  touched: boolean;
}

interface FormState {
  [fieldName: string]: FieldState;
}

export function useForm<T extends Record<string, string>>(
  initialValues: T,
  validators: Record<keyof T, (value: string) => string | null>
) {
  const [formState, setFormState] = useState<FormState>(
    Object.keys(initialValues).reduce((acc, key) => {
      acc[key] = {
        value: initialValues[key as keyof T],
        error: null,
        touched: false,
      };
      return acc;
    }, {} as FormState)
  );

  const validateField = useCallback((fieldName: keyof T, value: string) => {
    const validator = validators[fieldName];
    return validator ? validator(value) : null;
  }, [validators]);

  const handleChange = useCallback((fieldName: keyof T, value: string) => {
    const error = validateField(fieldName, value);
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        error,
        touched: true,
      },
    }));
  }, [validateField]);

  const handleBlur = useCallback((fieldName: keyof T) => {
    const field = formState[fieldName];
    if (!field.touched) {
      const error = validateField(fieldName, field.value);
      setFormState(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          error,
          touched: true,
        },
      }));
    }
  }, [formState, validateField]);

  const handleSubmit = useCallback((onSubmit: (values: T) => void) => {
    // 验证所有字段
    let isValid = true;
    const newFormState = { ...formState };

    Object.keys(initialValues).forEach(fieldName => {
      const error = validateField(fieldName as keyof T, formState[fieldName].value);
      newFormState[fieldName] = {
        ...newFormState[fieldName],
        error,
        touched: true,
      };
      if (error) {
        isValid = false;
      }
    });

    setFormState(newFormState);

    if (isValid) {
      const values = Object.keys(initialValues).reduce((acc, key) => {
        acc[key as keyof T] = newFormState[key].value;
        return acc;
      }, {} as T);
      onSubmit(values);
    }
  }, [formState, initialValues, validateField]);

  const getFieldProps = useCallback((fieldName: keyof T) => {
    return {
      value: formState[fieldName].value,
      error: formState[fieldName].touched ? formState[fieldName].error : null,
      onChange: (value: string) => handleChange(fieldName, value),
      onBlur: () => handleBlur(fieldName),
    };
  }, [formState, handleChange, handleBlur]);

  return {
    formState,
    getFieldProps,
    handleSubmit,
  };
}
```

#### 使用示例

```tsx
import { useForm } from './useForm';

interface LoginForm {
  email: string;
  password: string;
}

const initialValues: LoginForm = {
  email: '',
  password: '',
};

const validators = {
  email: (value: string) => {
    if (!value) return '邮箱为必填项';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入有效的邮箱';
    return null;
  },
  password: (value: string) => {
    if (!value) return '密码为必填项';
    if (value.length < 8) return '密码长度至少8位';
    return null;
  },
};

export function LoginForm() {
  const { getFieldProps, handleSubmit } = useForm(initialValues, validators);
  const emailProps = getFieldProps('email');
  const passwordProps = getFieldProps('password');

  const onSubmit = (values: LoginForm) => {
    console.log('提交表单:', values);
    // 调用API提交
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }}>
      <div>
        <label>邮箱</label>
        <input
          type="email"
          value={emailProps.value}
          onChange={(e) => emailProps.onChange(e.target.value)}
          onBlur={emailProps.onBlur}
        />
        {emailProps.error && <span className="error">{emailProps.error}</span>}
      </div>

      <div>
        <label>密码</label>
        <input
          type="password"
          value={passwordProps.value}
          onChange={(e) => passwordProps.onChange(e.target.value)}
          onBlur={passwordProps.onBlur}
        />
        {passwordProps.error && <span className="error">{passwordProps.error}</span>}
      </div>

      <button type="submit">登录</button>
    </form>
  );
}
```

### 3. 高级验证技巧

#### 跨字段验证

```tsx
interface PasswordForm {
  password: string;
  confirmPassword: string;
}

const validatePasswordForm = (values: PasswordForm) => {
  const errors: Partial<Record<keyof PasswordForm, string>> = {};

  if (!values.password) {
    errors.password = '密码为必填项';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = '确认密码为必填项';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致';
  }

  return errors;
};
```

#### 异步验证

```tsx
// 检查邮箱是否已注册
const validateEmailUnique = async (email: string): Promise<string | null> => {
  try {
    const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    if (data.exists) {
      return '该邮箱已被注册';
    }
    return null;
  } catch (error) {
    return '验证失败，请稍后重试';
  }
};
```

#### 正则表达式验证库

```tsx
// 常见正则表达式
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^1[3-9]\d{9}$/,
  idCard: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  chinese: /^[\u4e00-\u9fa5]+$/,
  number: /^\d+$/,
  integer: /^-?\d+$/,
  float: /^-?\d+(\.\d+)?$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^([01]?\d|2[0-3]):([0-5]?\d):([0-5]?\d)$/,
};
```

### 4. 表单组件封装

#### Input组件

```tsx
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={`form-group ${error ? 'has-error' : ''}`}>
        <label>{label}</label>
        <input
          ref={ref}
          className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
          {...props}
        />
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }
);
```

#### 错误消息样式

```css
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  font-size: 1rem;
  background-color: var(--bg-input);
  color: var(--text-primary);
}

.form-control:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.form-control.is-invalid {
  border-color: var(--danger-color);
}

.error-message {
  color: var(--danger-color);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.has-error .form-control {
  border-color: var(--danger-color);
}
```

### 5. 表单验证最佳实践

#### 验证时机
1. **实时验证** - 用户输入时即时反馈
2. **失焦验证** - 字段失去焦点时验证
3. **提交验证** - 表单提交前完整验证

#### 错误提示策略
- 清晰明确的错误信息
- 提供修复建议
- 使用用户友好的语言
- 错误位置明显
- 考虑无障碍访问

#### 性能优化
- 防抖处理频繁验证
- 异步验证去重
- 避免不必要的重新渲染

## Examples

### 完整注册表单示例

```tsx
import { useForm } from './useForm';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

const initialValues: RegisterForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agree: false,
};

const validators = {
  name: (value: string) => {
    if (!value.trim()) return '姓名为必填项';
    if (value.length < 2) return '姓名至少2个字符';
    return null;
  },
  email: (value: string) => {
    if (!value) return '邮箱为必填项';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入有效的邮箱';
    return null;
  },
  phone: (value: string) => {
    if (!value) return '手机号为必填项';
    if (!/^1[3-9]\d{9}$/.test(value)) return '请输入有效的手机号';
    return null;
  },
  password: (value: string) => {
    if (!value) return '密码为必填项';
    if (value.length < 8) return '密码长度至少8位';
    if (!/[A-Z]/.test(value)) return '密码需要包含大写字母';
    if (!/[0-9]/.test(value)) return '密码需要包含数字';
    return null;
  },
  confirmPassword: (value: string) => {
    if (!value) return '确认密码为必填项';
    return null;
  },
  agree: (value: boolean) => {
    if (!value) return '请同意用户协议';
    return null;
  },
};

export function RegisterForm() {
  const { getFieldProps, handleSubmit, formState } = useForm(initialValues, validators);

  // 跨字段验证
  const confirmPasswordError = formState.confirmPassword.touched
    ? formState.password.value !== formState.confirmPassword.value
      ? '两次输入的密码不一致'
      : null
    : null;

  const onSubmit = (values: RegisterForm) => {
    if (values.password !== values.confirmPassword) {
      console.log('密码不一致');
      return;
    }
    console.log('提交注册:', values);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }}>
      {/* 字段省略... */}
    </form>
  );
}
```
