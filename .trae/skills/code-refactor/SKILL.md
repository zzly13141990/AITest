---
name: "code-refactor"
description: "代码精简重构，提供重构原则、代码异味识别、重构步骤等。Invoke when refactoring code, improving code quality, or optimizing architecture."
---

# Code Refactor - 代码精简重构

## Description

此技能用于代码重构，提供重构原则、代码异味识别、重构步骤等，提升代码质量和可维护性。

## Usage Scenario

- 代码重构
- 质量提升
- 架构优化
- 技术债偿还
- 代码审查

## Instructions

### 1. 重构原则

#### SOLID原则

```typescript
// S - 单一职责原则 (Single Responsibility Principle)
// 一个类/函数只负责一个功能

// ✅ 好 - 分离职责
class UserRepository {
  getUser(id: number) { /* ... */ }
  saveUser(user: User) { /* ... */ }
}

class UserEmailService {
  sendWelcomeEmail(user: User) { /* ... */ }
}

// ❌ 不好 - 职责过多
class UserManager {
  getUser(id: number) { /* ... */ }
  saveUser(user: User) { /* ... */ }
  sendWelcomeEmail(user: User) { /* ... */ }
  generateReport() { /* ... */ }
}

// O - 开闭原则 (Open/Closed Principle)
// 对扩展开放，对修改关闭

// ✅ 好 - 可扩展
interface PaymentProcessor {
  processPayment(amount: number): void;
}

class AliPayProcessor implements PaymentProcessor {
  processPayment(amount: number) { /* ... */ }
}

class WeChatPayProcessor implements PaymentProcessor {
  processPayment(amount: number) { /* ... */ }
}

// L - 里氏替换原则 (Liskov Substitution Principle)
// 子类可以替换父类而不影响程序正确性

// I - 接口隔离原则 (Interface Segregation Principle)
// 接口应该小而专，不是大而全

// D - 依赖倒置原则 (Dependency Inversion Principle)
// 依赖抽象，不依赖具体实现
```

### 2. 代码异味识别

#### 重复代码 (Duplication)

```typescript
// ❌ 重复代码
function calculateTotalPrice(price: number, quantity: number) {
  const tax = price * 0.08;
  const discount = price > 100 ? 10 : 0;
  return price * quantity + tax - discount;
}

function calculateMemberPrice(price: number, quantity: number) {
  const tax = price * 0.08;
  const discount = price > 100 ? 10 : 0;
  const memberDiscount = 5;
  return price * quantity + tax - discount - memberDiscount;
}

// ✅ 提取公共逻辑
function calculateBasePrice(price: number, quantity: number) {
  const tax = price * 0.08;
  const discount = price > 100 ? 10 : 0;
  return price * quantity + tax - discount;
}

function calculateTotalPrice(price: number, quantity: number) {
  return calculateBasePrice(price, quantity);
}

function calculateMemberPrice(price: number, quantity: number) {
  return calculateBasePrice(price, quantity) - 5;
}
```

#### 长函数/长类 (Long Function/Long Class)

```typescript
// ❌ 长函数
function processOrder(order: Order) {
  // 50行以上的代码...
  // 验证订单
  // 计算价格
  // 应用折扣
  // 生成订单号
  // 保存数据库
  // 发送邮件
  // 记录日志
}

// ✅ 拆分为小函数
function processOrder(order: Order) {
  validateOrder(order);
  const price = calculatePrice(order);
  const finalPrice = applyDiscount(price);
  const orderNo = generateOrderNo();
  saveOrder(order, orderNo);
  sendNotification(order);
  logOrder(order);
}

function validateOrder(order: Order) { /* ... */ }
function calculatePrice(order: Order) { /* ... */ }
function applyDiscount(price: number) { /* ... */ }
function generateOrderNo() { /* ... */ }
function saveOrder(order: Order, orderNo: string) { /* ... */ }
function sendNotification(order: Order) { /* ... */ }
function logOrder(order: Order) { /* ... */ }
```

#### 上帝类/上帝对象 (God Class/God Object)

```typescript
// ❌ 上帝类
class OrderManager {
  validateOrder(order: Order) { /* ... */ }
  calculatePrice(order: Order) { /* ... */ }
  saveOrder(order: Order) { /* ... */ }
  sendEmail(order: Order) { /* ... */ }
  generateReport(order: Order) { /* ... */ }
  refundOrder(order: Order) { /* ... */ }
  cancelOrder(order: Order) { /* ... */ }
  // ... 更多方法
}

// ✅ 拆分为多个类
class OrderValidator {
  validateOrder(order: Order) { /* ... */ }
}

class OrderPricingService {
  calculatePrice(order: Order) { /* ... */ }
  applyDiscount(price: number) { /* ... */ }
}

class OrderRepository {
  saveOrder(order: Order) { /* ... */ }
}

class OrderNotificationService {
  sendEmail(order: Order) { /* ... */ }
}
```

#### 魔法数字/魔法字符串 (Magic Numbers/Magic Strings)

```typescript
// ❌ 魔法数字
if (user.status === 1) {
  return;
}
if (order.total > 100) {
  discount = 10;
}

// ✅ 使用常量
const UserStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
  DELETED: 2,
} as const;

const DiscountConfig = {
  THRESHOLD: 100,
  AMOUNT: 10,
};

if (user.status === UserStatus.ACTIVE) {
  return;
}
if (order.total > DiscountConfig.THRESHOLD) {
  discount = DiscountConfig.AMOUNT;
}
```

#### 深层嵌套 (Deep Nesting)

```typescript
// ❌ 深层嵌套
function processOrder(order: Order) {
  if (order) {
    if (order.items) {
      if (order.items.length > 0) {
        for (const item of order.items) {
          if (item.valid) {
            if (item.quantity > 0) {
              // 处理
            }
          }
        }
      }
    }
  }
}

// ✅ 提前返回
function processOrder(order: Order) {
  if (!order) return;
  if (!order.items) return;
  if (order.items.length === 0) return;

  for (const item of order.items) {
    if (!item.valid) continue;
    if (item.quantity <= 0) continue;
    // 处理
  }
}
```

### 3. 常用重构技巧

#### 提取函数 (Extract Function)

```typescript
// 重构前
function printInvoice(orders: Order[]) {
  for (const order of orders) {
    console.log(`Order #${order.id}`);
    console.log(`Customer: ${order.customer}`);
    console.log(`Total: ${order.total}`);
    console.log('---');
  }
}

// 重构后
function printInvoice(orders: Order[]) {
  for (const order of orders) {
    printOrder(order);
  }
}

function printOrder(order: Order) {
  console.log(`Order #${order.id}`);
  console.log(`Customer: ${order.customer}`);
  console.log(`Total: ${order.total}`);
  console.log('---');
}
```

#### 提取变量 (Extract Variable)

```typescript
// 重构前
function calculateTotal(price: number, quantity: number) {
  return (price * quantity) - (price * quantity * 0.1) + 5;
}

// 重构后
function calculateTotal(price: number, quantity: number) {
  const subtotal = price * quantity;
  const discount = subtotal * 0.1;
  const shipping = 5;
  return subtotal - discount + shipping;
}
```

#### 以对象取代数据项 (Replace Data Value with Object)

```typescript
// 重构前
const user = {
  id: 1,
  name: 'John',
  phone: '13800138000',
};

function isPhoneValid(phone: string) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 重构后
class Phone {
  private _value: string;

  constructor(value: string) {
    if (!/^1[3-9]\d{9}$/.test(value)) {
      throw new Error('Invalid phone number');
    }
    this._value = value;
  }

  get value() { return this._value; }
}

const user = {
  id: 1,
  name: 'John',
  phone: new Phone('13800138000'),
};
```

### 4. 性能优化重构

#### 减少不必要的渲染 (React)

```tsx
// 重构前 - 每次渲染都会创建新函数
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log('clicked');
  };

  return <Child onClick={handleClick} />;
}

// 重构后 - 使用 useCallback
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <Child onClick={handleClick} />;
}

// 使用 memo 优化组件
const Child = React.memo(({ onClick }) => {
  return <button onClick={onClick}>Click</button>;
});
```

#### 避免内存泄漏

```typescript
// 重构前 - 忘记清除定时器
useEffect(() => {
  setInterval(() => {
    console.log('tick');
  }, 1000);
}, []);

// 重构后 - 正确清除
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

### 5. 重构检查清单

- [ ] 所有测试通过
- [ ] 代码规范检查通过
- [ ] 没有引入新的依赖
- [ ] 性能没有下降
- [ ] 文档已更新
- [ ] 代码审查已完成
- [ ] 回滚方案已准备

## Examples

### 完整重构示例

#### 重构前

```typescript
// 问题：长函数、重复代码、魔法数字
function processUsers(users: User[]) {
  const result: { id: number; name: string; status: string }[] = [];

  for (const user of users) {
    if (user.status === 1) {
      let displayName = user.name;
      if (user.name.length > 10) {
        displayName = user.name.substring(0, 10) + '...';
      }
      result.push({
        id: user.id,
        name: displayName,
        status: 'active',
      });
    }
  }

  return result;
}
```

#### 重构后

```typescript
const UserStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
  DELETED: 2,
} as const;

const DisplayConfig = {
  MAX_NAME_LENGTH: 10,
} as const;

interface ProcessedUser {
  id: number;
  name: string;
  status: string;
}

function processUsers(users: User[]): ProcessedUser[] {
  return users
    .filter(isActiveUser)
    .map(processUser);
}

function isActiveUser(user: User): boolean {
  return user.status === UserStatus.ACTIVE;
}

function processUser(user: User): ProcessedUser {
  return {
    id: user.id,
    name: formatUserName(user.name),
    status: 'active',
  };
}

function formatUserName(name: string): string {
  if (name.length <= DisplayConfig.MAX_NAME_LENGTH) {
    return name;
  }
  return name.substring(0, DisplayConfig.MAX_NAME_LENGTH) + '...';
}
```
