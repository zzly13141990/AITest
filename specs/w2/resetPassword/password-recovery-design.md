# 找回密码功能需求和设计文档

## 1. 需求分析

### 1.1 功能需求
- 用户通过用户名找回密码
- 系统发送验证码到用户邮箱/手机（前端模拟）
- 用户输入验证码进行验证
- 用户设置新密码
- 确认新密码
- 提交表单完成密码重置

### 1.2 非功能需求
- 验证码发送频率限制：每60秒只能发送一次
- 表单验证：确保所有字段输入正确
- 提示信息：操作过程中提供清晰的反馈
- 响应式设计：适配不同屏幕尺寸
- 用户体验：流畅的交互流程

## 2. 页面设计

### 2.1 页面结构
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>找回密码</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="script.js"></script>
</head>
<body>
    <div class="container">
        <div class="password-recovery-form">
            <h1>找回密码</h1>
            <form id="recovery-form">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input type="text" id="username" name="username" required>
                    <div class="error-message" id="username-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="verification-code">验证码</label>
                    <div class="code-input-group">
                        <input type="text" id="verification-code" name="verification-code" required>
                        <button type="button" id="send-code-btn" class="send-code-btn">发送验证码</button>
                    </div>
                    <div class="error-message" id="code-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="new-password">新密码</label>
                    <input type="password" id="new-password" name="new-password" required>
                    <div class="error-message" id="password-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="confirm-password">确认密码</label>
                    <input type="password" id="confirm-password" name="confirm-password" required>
                    <div class="error-message" id="confirm-error"></div>
                </div>
                
                <div class="form-group">
                    <button type="submit" id="submit-btn" class="submit-btn">提交</button>
                </div>
                
                <div class="message" id="form-message"></div>
            </form>
        </div>
    </div>
</body>
</html>
```

### 2.2 样式设计
```css
/* 基础样式 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background-color: #f5f5f5;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}

.container {
    width: 100%;
    max-width: 400px;
    padding: 20px;
}

.password-recovery-form {
    background-color: #ffffff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
    text-align: center;
    margin-bottom: 30px;
    color: #333;
}

.form-group {
    margin-bottom: 20px;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #555;
}

input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
}

input:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.code-input-group {
    display: flex;
    gap: 10px;
}

.code-input-group input {
    flex: 1;
}

.send-code-btn {
    padding: 0 15px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    white-space: nowrap;
}

.send-code-btn:hover {
    background-color: #45a049;
}

.send-code-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.submit-btn {
    width: 100%;
    padding: 12px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s;
}

.submit-btn:hover {
    background-color: #45a049;
}

.error-message {
    color: #f44336;
    font-size: 12px;
    margin-top: 5px;
}

.message {
    margin-top: 20px;
    padding: 10px;
    border-radius: 4px;
    text-align: center;
}

.message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

/* 响应式设计 */
@media (max-width: 480px) {
    .container {
        padding: 10px;
    }
    
    .password-recovery-form {
        padding: 20px;
    }
    
    .code-input-group {
        flex-direction: column;
    }
    
    .send-code-btn {
        padding: 10px;
    }
}
```

## 3. 交互设计

### 3.1 功能流程
1. 用户访问找回密码页面
2. 用户输入用户名
3. 用户点击"发送验证码"按钮
4. 系统模拟发送验证码（前端显示提示）
5. 按钮进入60秒倒计时状态，期间不可再次点击
6. 用户输入收到的验证码
7. 用户输入新密码和确认密码
8. 用户点击"提交"按钮
9. 系统验证所有输入
10. 验证通过后显示成功提示
11. 验证失败则显示错误提示

### 3.2 交互逻辑
- **用户名验证**：非空验证
- **验证码发送**：点击后按钮禁用，开始60秒倒计时
- **验证码验证**：非空验证
- **密码验证**：非空验证，密码强度验证
- **确认密码验证**：非空验证，与新密码一致性验证
- **表单提交**：所有字段验证通过后提交

## 4. 技术实现方案

### 4.1 接口调用

#### 4.1.1 发送验证码接口
- **接口地址**：`/api/auth/send-verification-code`
- **请求方法**：POST
- **请求参数**：
  ```json
  {
    "username": "string" // 用户名
  }
  ```
- **返回结果**：
  ```json
  {
    "code": 200,
    "message": "验证码发送成功",
    "data": {
      "expiresIn": 300 // 验证码有效期（秒）
    }
  }
  ```

#### 4.1.2 密码重置接口
- **接口地址**：`/api/auth/reset-password`
- **请求方法**：POST
- **请求参数**：
  ```json
  {
    "username": "string", // 用户名
    "verificationCode": "string", // 验证码
    "newPassword": "string", // 新密码
    "confirmPassword": "string" // 确认密码
  }
  ```
- **返回结果**：
  ```json
  {
    "code": 200,
    "message": "密码重置成功",
    "data": {
      "userId": 123, // 用户ID
      "username": "string" // 用户名
    }
  }
  ```

### 4.2 JavaScript 代码
```javascript
$(document).ready(function() {
    // 表单验证
    $('#recovery-form').on('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            // 提交密码重置
            submitResetPassword();
        }
    });
    
    // 发送验证码按钮点击事件
    $('#send-code-btn').on('click', function() {
        const username = $('#username').val().trim();
        
        if (!username) {
            $('#username-error').text('请输入用户名');
            return;
        }
        
        // 清除错误信息
        $('#username-error').text('');
        
        // 禁用按钮并开始倒计时
        const btn = $(this);
        btn.prop('disabled', true);
        
        // 调用发送验证码接口
        sendVerificationCode(username);
        
        // 60秒倒计时
        let countdown = 60;
        btn.text(`${countdown}秒后重发`);
        
        const timer = setInterval(function() {
            countdown--;
            btn.text(`${countdown}秒后重发`);
            
            if (countdown <= 0) {
                clearInterval(timer);
                btn.prop('disabled', false);
                btn.text('发送验证码');
            }
        }, 1000);
    });
    
    // 输入框焦点事件，清除错误信息
    $('input').on('focus', function() {
        $(`#${$(this).attr('id')}-error`).text('');
    });
    
    // 密码输入事件，实时验证
    $('#new-password, #confirm-password').on('input', function() {
        validatePasswords();
    });
    
    // 验证表单
    function validateForm() {
        let isValid = true;
        
        // 验证用户名
        const username = $('#username').val().trim();
        if (!username) {
            $('#username-error').text('请输入用户名');
            isValid = false;
        } else {
            $('#username-error').text('');
        }
        
        // 验证验证码
        const code = $('#verification-code').val().trim();
        if (!code) {
            $('#code-error').text('请输入验证码');
            isValid = false;
        } else {
            $('#code-error').text('');
        }
        
        // 验证密码
        if (!validatePasswords()) {
            isValid = false;
        }
        
        return isValid;
    }
    
    // 验证密码
    function validatePasswords() {
        let isValid = true;
        
        const password = $('#new-password').val();
        const confirmPassword = $('#confirm-password').val();
        
        // 验证新密码
        if (!password) {
            $('#password-error').text('请输入新密码');
            isValid = false;
        } else if (password.length < 6) {
            $('#password-error').text('密码长度至少为6位');
            isValid = false;
        } else {
            $('#password-error').text('');
        }
        
        // 验证确认密码
        if (!confirmPassword) {
            $('#confirm-error').text('请确认新密码');
            isValid = false;
        } else if (confirmPassword !== password) {
            $('#confirm-error').text('两次输入的密码不一致');
            isValid = false;
        } else {
            $('#confirm-error').text('');
        }
        
        return isValid;
    }
    
    // 发送验证码接口调用
    function sendVerificationCode(username) {
        // 调用发送验证码接口
        $.ajax({
            url: '/api/auth/send-verification-code',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username: username }),
            success: function(response) {
                console.log('发送验证码接口返回:', response);
                // 显示成功提示
                $('#form-message')
                    .removeClass('error')
                    .addClass('success')
                    .text('验证码已发送到您的邮箱/手机');
            },
            error: function(xhr, status, error) {
                console.error('发送验证码失败:', error);
                // 显示错误提示
                $('#form-message')
                    .removeClass('success')
                    .addClass('error')
                    .text('发送验证码失败，请稍后重试');
                // 恢复按钮状态
                $('#send-code-btn').prop('disabled', false).text('发送验证码');
            }
        });
    }
    
    // 提交密码重置接口调用
    function submitResetPassword() {
        // 收集表单数据
        const formData = {
            username: $('#username').val().trim(),
            verificationCode: $('#verification-code').val().trim(),
            newPassword: $('#new-password').val(),
            confirmPassword: $('#confirm-password').val()
        };
        
        // 调用密码重置接口
        $.ajax({
            url: '/api/auth/reset-password',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('密码重置接口返回:', response);
                // 显示成功提示
                $('#form-message')
                    .removeClass('error')
                    .addClass('success')
                    .text('密码重置成功！');
                // 清空表单
                $('#recovery-form')[0].reset();
            },
            error: function(xhr, status, error) {
                console.error('密码重置失败:', error);
                // 显示错误提示
                $('#form-message')
                    .removeClass('success')
                    .addClass('error')
                    .text('密码重置失败，请稍后重试');
            }
        });
    }
});
```

## 5. 测试方案

### 5.1 功能测试
- 测试用户名输入框的非空验证
- 测试验证码发送功能和倒计时
- 测试验证码输入框的非空验证
- 测试密码输入框的非空验证和长度验证
- 测试确认密码输入框的非空验证和一致性验证
- 测试表单提交功能

### 5.2 用户体验测试
- 测试页面响应式布局
- 测试错误提示的清晰度
- 测试交互流程的流畅性
- 测试按钮状态变化的合理性

## 6. 总结

本设计文档提供了一个完整的找回密码功能实现方案，包括：
- 清晰的页面结构和样式设计
- 完整的交互逻辑和表单验证
- 详细的技术实现代码
- 全面的测试方案

该方案仅涉及前端实现，不需要后端支持，适合作为前端开发练习或原型设计使用。通过模拟验证码发送和表单提交，用户可以体验完整的找回密码流程。