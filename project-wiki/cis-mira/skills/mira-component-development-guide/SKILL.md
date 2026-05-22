---
name: mira-component-development-guide
description: Mira 组件开发规范 - 定义组件结构、分层架构(ui/feature/composite)、API 管理、样式规范(Tailwind/styled-components)、状态管理(Jotai)、文档要求(README/CHANGELOG)等完整开发流程。创建或修改组件时必须遵循此规范。
---

# 组件开发规范 (Mira Component Development Guide)

> **版本**: v1.0.0  
> **最后更新**: 2026-01-27  
> **维护者**: Mira Team

---

## 📋 目录

- [1. 组件结构规范](#1-组件结构规范)
- [2. 组件设计原则](#2-组件设计原则)
- [3. 样式规范](#3-样式规范)
- [4. 组件分层架构](#4-组件分层架构)
- [5. 技术栈与依赖](#5-技术栈与依赖)
- [6. 开发流程](#6-开发流程)
- [7. 最佳实践](#7-最佳实践)
- [8. 示例模板](#8-示例模板)

---

## 1. 组件结构规范

### 1.1 文件夹结构

每个组件必须独立成文件夹，包含以下必需文件：

```
src/components/
├── [component-name]/
│   ├── index.tsx              # 组件主文件（必需）
│   ├── README.md              # 组件文档（必需）
│   ├── CHANGELOG.md           # 变更日志（必需）
│   ├── types.ts               # TypeScript 类型定义（可选）
│   ├── hooks.ts               # 自定义 Hooks（可选）
│   ├── utils.ts               # 工具函数（可选）
│   ├── constants.ts           # 常量定义（可选）
│   └── __tests__/             # 测试文件（推荐）
│       └── index.test.tsx
```

### 1.2 README.md 模板

```markdown
# ComponentName

## 概述
简要描述组件的功能和用途。

## 作者
- **姓名**: [你的姓名]
- **邮箱**: [your.email@bytedance.com]
- **创建日期**: YYYY-MM-DD

## Props

| 属性名 | 类型 | 必需 | 默认值 | 描述 |
|--------|------|------|--------|------|
| prop1  | string | 是 | - | 属性描述 |
| prop2  | number | 否 | 0 | 属性描述 |

## 使用示例

\`\`\`tsx
import { ComponentName } from '@/components/component-name';

<ComponentName prop1="value" prop2={42} />
\`\`\`

## 依赖
- 列出外部依赖
- 列出内部组件依赖

## 注意事项
- 特殊使用场景说明
- 已知限制
```

### 1.3 CHANGELOG.md 模板

```markdown
# Changelog

## [Unreleased]

## [1.0.0] - YYYY-MM-DD
### Added
- 初始版本
- 功能描述

### Changed
- 变更描述

### Fixed
- 修复描述

### Breaking Changes
- 破坏性变更说明
```

---

## 2. 组件设计原则

### 2.1 高内聚低耦合

✅ **正确示例**：
```tsx
// ✅ 组件内部维护自己的状态
export const Counter: React.FC<CounterProps> = ({ 
  initialValue = 0,
  onChange 
}) => {
  const [count, setCount] = useState(initialValue);

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    onChange?.(newCount);
  };

  return (
    <div>
      <span>{count}</span>
      <button onClick={handleIncrement}>+</button>
    </div>
  );
};
```

❌ **错误示例**：
```tsx
// ❌ 过度依赖外部状态，耦合度高
export const Counter: React.FC = () => {
  const globalState = useGlobalStore(); // 避免直接依赖全局状态
  const userInfo = useUserContext(); // 避免不必要的上下文依赖
  
  return <div>{globalState.count}</div>;
};
```

### 2.2 Props 驱动

**必须遵守**：
- 所有外部数据通过 Props 传入
- 使用 TypeScript 严格定义 Props 类型
- 提供合理的默认值
- 使用回调函数进行数据通信

```tsx
interface ButtonProps {
  /** 按钮文本 */
  children: React.ReactNode;
  /** 按钮类型 */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 点击回调 */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** 自定义类名 */
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  onClick,
  className,
}) => {
  // 组件实现
};
```

### 2.3 状态管理

**内部状态** - 使用 `useState` / `useReducer`：
```tsx
const [isOpen, setIsOpen] = useState(false);
const [selectedIndex, setSelectedIndex] = useState(0);
```

**外部状态** - 通过 Props 传入：
```tsx
interface ControlledComponentProps {
  value: string;
  onChange: (value: string) => void;
}
```

**全局状态** - 使用 Jotai（仅在必要时）：
```tsx
import { atom, useAtom } from 'jotai';

// 在 store/atoms/ 中定义
export const themeAtom = atom<'light' | 'dark'>('light');

// 在组件中使用
const [theme, setTheme] = useAtom(themeAtom);
```

---

## 3. 样式规范

### 3.1 优先级顺序

1. **Tailwind CSS**（首选）
2. **styled-components**（复杂样式）
3. **CSS Modules**（特殊场景）

> 颜色必须来自设计系统 token。详见 `mira-design-system` skill：禁止 hex / rgba / Tailwind 原生色阶 (`bg-white`, `bg-blue-600`, `text-gray-700` 等) / 旧无前缀别名 (`var(--text-title)`)。

### 3.2 Tailwind CSS 使用规范

✅ **推荐写法**：
```tsx
import { cn } from '@/lib/utils';

export const Card: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        // 基础样式：颜色来自 DS 注册的 Tailwind 短类名
        'rounded-lg border border-line-border-card bg-bg-content-base p-4 shadow-sm',
        // 响应式
        'md:p-6 lg:p-8',
        // 交互状态：hover 填充使用 DS fill-hover 语义
        'transition-shadow hover:shadow-md',
        // 外部传入的类名
        className
      )}
    >
      {children}
    </div>
  );
};
```

**关键工具函数**：
```tsx
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3.3 styled-components 使用场景

仅在以下情况使用：
- 复杂动画效果
- 需要主题变量的动态样式
- Tailwind 无法满足的特殊需求

```tsx
import styled from 'styled-components';

const StyledButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;

  ${({ $variant }) =>
    $variant === 'primary'
      ? `
        background: var(--color-primary-fill-default);
        color: var(--color-primary-on-primary-fill);
      `
      : `
        background: transparent;
        border: 1px solid var(--color-line-border-component);
        color: var(--color-text-title);
      `}

  &:hover {
    transform: translateY(-2px);
    /* 阴影颜色统一来自 DS shadow token，禁止 rgba(0,0,0,...) */
    box-shadow: 0 4px 12px color-mix(in srgb, var(--color-shadow-default) 12%, transparent);
  }
`;
```

### 3.4 响应式设计

使用 Tailwind 断点：
```tsx
<div className="
  w-full 
  sm:w-1/2 
  md:w-1/3 
  lg:w-1/4 
  xl:w-1/5
">
  {/* 内容 */}
</div>
```

---

## 4. 组件分层架构

### 4.1 分层原则与目录结构

**强制规范**：所有组件必须严格按照以下三层架构组织，禁止混乱放置。

```
src/design/
├── ui/                           # Layer 1: 基础 UI 组件（无业务逻辑）
│   ├── Button/
│   │   ├── index.tsx            # 组件主文件
│   │   ├── README.md            # 组件文档
│   │   ├── CHANGELOG.md         # 变更日志
│   │   └── types.ts             # 类型定义（可选）
│   ├── Input/
│   ├── Dialog/
│   ├── Card/
│   ├── Dropdown/
│   └── ...
│
├── feature/                      # Layer 2: 业务功能组件（包含业务逻辑）
│   ├── Greeting/
│   │   ├── index.tsx            # 组件主文件
│   │   ├── README.md            # 组件文档
│   │   ├── CHANGELOG.md         # 变更日志
│   │   ├── api.ts               # 后端数据接口（必需，无接口则 mock）
│   │   ├── types.ts             # 类型定义
│   │   ├── hooks.ts             # 自定义 Hooks（可选）
│   │   └── query-options.ts     # React Query 配置（可选）
│   ├── WelcomeCard/
│   │   ├── index.tsx
│   │   ├── README.md
│   │   ├── CHANGELOG.md
│   │   └── types.ts
│   ├── UserProfile/
│   │   ├── index.tsx
│   │   ├── README.md
│   │   ├── CHANGELOG.md
│   │   ├── api.ts               # 用户数据 API
│   │   └── types.ts
│   └── ...
│
└── composite/                    # Layer 3: 复合页面组件（组合多个 feature）
    ├── DashboardCard/
    │   ├── index.tsx            # 组件主文件
    │   ├── README.md            # 组件文档
    │   └── CHANGELOG.md         # 变更日志
    ├── ChatPage/
    │   ├── index.tsx
    │   ├── README.md
    │   ├── CHANGELOG.md
    │   └── sections/            # 页面区块（可选）
    │       ├── header.tsx
    │       ├── sidebar.tsx
    │       └── content.tsx
    └── ...
```

### 4.2 Layer 1: UI 基础组件（ui/）

**定位**：纯视图组件，零业务逻辑，100% 可复用

**判断标准**：
- ✅ 能否在任何项目中直接复用？
- ✅ 是否完全由 Props 驱动？
- ✅ 是否不依赖任何业务状态（Jotai atoms、Context）？
- ✅ 是否不包含 API 调用？

**特征**：
- **无业务逻辑**：不包含任何业务规则、数据处理
- **高度可复用**：可在任何项目中使用
- **仅依赖 Props**：所有数据通过 Props 传入
- **样式可定制**：支持 className、style 等自定义
- **无 API 调用**：不包含 `api.ts` 文件
- **无全局状态**：不使用 Jotai、Context 等全局状态

**文件结构**：
```
ui/Button/
├── index.tsx              # 必需
├── README.md              # 必需（包含作者信息）
├── CHANGELOG.md           # 必需
└── types.ts               # 可选（复杂组件才需要）
```

**禁止事项**：
- ❌ 不能包含 `api.ts`
- ❌ 不能使用 `useAtom`、`useContext`
- ❌ 不能包含业务逻辑判断（如权限、角色）
- ❌ 不能直接调用后端接口

**示例**：
```tsx
// src/design/ui/Button/index.tsx
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-[var(--color-primary-fill-hover)]',
        secondary: 'bg-bg-body-overlay text-text-title hover:bg-fill-hover',
        ghost: 'text-text-title hover:bg-fill-hover',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant,
  size,
  loading,
  disabled,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
};
```

### 4.3 Layer 2: Feature 业务组件（feature/）

**定位**：包含业务逻辑的功能组件，服务于特定业务场景

**判断标准**：
- ✅ 是否包含特定业务逻辑？
- ✅ 是否需要调用后端 API？
- ✅ 是否依赖全局业务状态？
- ✅ 是否只在特定业务场景使用？

**特征**：
- **包含业务逻辑**：权限判断、数据处理、业务规则
- **依赖全局状态**：可使用 Jotai atoms、Context
- **组合 UI 组件**：使用 `ui/` 层的基础组件
- **特定场景使用**：为特定业务功能设计
- **必须包含 API**：所有后端交互都在 `api.ts` 中

**文件结构**：
```
feature/user-profile/
├── index.tsx              # 必需：组件主文件
├── README.md              # 必需：组件文档（包含作者信息）
├── CHANGELOG.md           # 必需：变更日志
├── api.ts                 # 必需：后端 API 接口（无接口则 mock）
├── types.ts               # 推荐：类型定义
├── hooks.ts               # 可选：自定义 Hooks
├── utils.ts               # 可选：工具函数
└── constants.ts           # 可选：常量定义
```

**API 管理规范（重要）**：

所有后端数据交互**必须**在 `api.ts` 中定义，禁止在组件中直接写 `fetch` 或 `axios`。

```tsx
// ✅ 正确：feature/Greeting/api.ts
import { request } from '@/lib/request';

export interface UserData {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface UpdateUserParams {
  name?: string;
  email?: string;
}

/**
 * 获取用户信息
 */
export async function fetchUserProfile(userId: string): Promise<UserData> {
  return request.get(`/api/users/${userId}`);
}

/**
 * 更新用户信息
 */
export async function updateUserProfile(
  userId: string,
  params: UpdateUserParams
): Promise<UserData> {
  return request.put(`/api/users/${userId}`, params);
}

/**
 * 上传用户头像
 */
export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('avatar', file);
  return request.post(`/api/users/${userId}/avatar`, formData);
}
```

**如果后端接口未开发，必须提供 Mock 数据**：

```tsx
// feature/user-profile/api.ts
import { request } from '@/lib/request';

const USE_MOCK = true; // 开发阶段使用 mock

// Mock 数据
const mockUserData: UserData = {
  id: '123',
  name: '张三',
  email: 'zhangsan@bytedance.com',
  avatar: 'https://example.com/avatar.jpg',
};

export async function fetchUserProfile(userId: string): Promise<UserData> {
  if (USE_MOCK) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockUserData;
  }
  return request.get(`/api/users/${userId}`);
}

export async function updateUserProfile(
  userId: string,
  params: UpdateUserParams
): Promise<UserData> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...mockUserData, ...params };
  }
  return request.put(`/api/users/${userId}`, params);
}
```

**组件示例**：

```tsx
// feature/user-profile/index.tsx
import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { userAtom } from '@/store/atoms/user';
import { cn } from '@/lib/utils';
import { fetchUserProfile, updateUserProfile, type UserData } from './api';

interface UserProfileProps {
  userId: string;
  onUpdate?: (data: UserData) => void;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onUpdate,
  className,
}) => {
  const [user, setUser] = useAtom(userAtom);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 加载用户数据
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const data = await fetchUserProfile(userId);
        setFormData(data);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [userId]);

  // 保存用户数据
  const handleSave = async () => {
    if (!formData) return;
    
    setIsLoading(true);
    try {
      const updated = await updateUserProfile(userId, {
        name: formData.name,
        email: formData.email,
      });
      setUser(updated);
      onUpdate?.(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !formData) {
    return <div>Loading...</div>;
  }

  if (!formData) {
    return <div>User not found</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('w-full max-w-md', className)}
    >
      <Card>
        <h2 className="text-xl font-bold mb-4">{formData.name}</h2>
        
        {isEditing ? (
          <div className="space-y-4">
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="姓名"
            />
            <Input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="邮箱"
            />
          </div>
        ) : (
          <p className="text-gray-600 mb-4">{formData.email}</p>
        )}
        
        <div className="flex gap-2 mt-4">
          <Button
            variant={isEditing ? 'secondary' : 'primary'}
            onClick={() => setIsEditing(!isEditing)}
            disabled={isLoading}
          >
            {isEditing ? '取消' : '编辑'}
          </Button>
          
          {isEditing && (
            <Button onClick={handleSave} loading={isLoading}>
              保存
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
```

**禁止事项**：
- ❌ 不能在组件中直接写 `fetch('/api/...')`
- ❌ 不能在组件中直接写 `axios.get('/api/...')`
- ❌ API 调用必须通过 `api.ts` 导出的函数

### 4.4 Layer 3: Composite 复合组件（composite/）

**定位**：页面级组件，组合多个 feature 组件，管理复杂交互流程

**判断标准**：
- ✅ 是否是完整的页面？
- ✅ 是否组合了多个 feature 组件？
- ✅ 是否管理复杂的页面级状态和交互？

**特征**：
- **页面级组件**：通常对应路由页面
- **组合多个 feature**：整合多个业务组件
- **管理复杂交互**：协调组件间的数据流和事件
- **可包含 API**：页面级的数据聚合接口（可选）

**文件结构**：
```
composite/DashboardCard/
├── index.tsx              # 必需：组件主文件
├── README.md              # 必需：组件文档
├── CHANGELOG.md           # 必需：变更日志
└── types.ts               # 可选：类型定义
```

**示例**：

```tsx
// composite/DashboardCard/index.tsx
import React from 'react';
import { Button } from '@/design/ui/Button';
import { WelcomeCard } from '@/design/feature/WelcomeCard';

export const DashboardCard: React.FC = () => {
  const [messages, setMessages] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleSendMessage = async (text: string) => {
    // 处理消息发送逻辑
    const newMessage = { id: Date.now(), text, sender: 'user' };
    setMessages([...messages, newMessage]);
  };

  return (
    <Layout style={{ background: 'var(--color-bg-body)' }}>
      <ChatHeader />
      
      <Layout.Sider width={240}>
        <ChatSidebar onSelectUser={setSelectedUserId} />
      </Layout.Sider>

      <Layout.Content style={{ overflow: 'hidden auto' }}>
        <div className="flex flex-col h-full">
          {/* 消息列表 */}
          <div className="flex-1 overflow-auto p-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>

          {/* 输入框 */}
          <div className="border-t border-line-divider-default p-4">
            <PromptInput onSubmit={handleSendMessage} />
          </div>
        </div>
      </Layout.Content>

      {/* 侧边栏：用户信息 */}
      {selectedUserId && (
        <Layout.Sider width={300}>
          <UserProfile userId={selectedUserId} />
        </Layout.Sider>
      )}
    </Layout>
  );
};
```

### 4.5 分层决策流程图

**如何判断组件应该放在哪一层？**

```
开始
  ↓
是否包含业务逻辑或 API 调用？
  ├─ 否 → 放入 ui/（Layer 1）
  └─ 是 ↓
     是否组合了多个 feature 组件？
       ├─ 否 → 放入 feature/（Layer 2）
       └─ 是 → 放入 composite/（Layer 3）
```

**实际案例**：

| 组件名称 | 分层 | 理由 |
|---------|------|------|
| Button | `ui/` | 纯视图，无业务逻辑 |
| Input | `ui/` | 纯视图，无业务逻辑 |
| Card | `ui/` | 纯视图，无业务逻辑 |
| UserProfile | `feature/` | 包含用户数据 API，业务逻辑 |
| PromptInput | `feature/` | 包含提示词优化 API，业务逻辑 |
| ChatMessage | `feature/` | 包含消息操作 API，业务逻辑 |
| ChatPage | `composite/` | 组合多个 feature，页面级 |
| AppLayout | `composite/` | 应用布局，组合多个区块 |

---

## 5. 技术栈与依赖

### 5.1 核心依赖

| 库 | 版本 | 用途 |
|---|---|---|
| **@universe-design/react** | ^3.28.2 | 企业级组件库 |
| **styled-components** | - | CSS-in-JS 方案 |
| **motion** | 12.23.26 | 动画库 |
| **@lottiefiles/dotlottie-react** | 0.17.12 | Lottie 动画 |
| **jotai** | 2.12.2 | 全局状态管理 |
| **ahooks** | 3.8.4 | React Hooks 工具库 |
| **class-variance-authority** | 0.7.1 | 样式变体管理 |
| **clsx** | 2.1.1 | 类名合并 |
| **tailwind-merge** | - | Tailwind 类名合并 |

### 5.2 UI 组件库

**Radix UI** (无样式基础组件)：
- `@radix-ui/react-dialog`
- `@radix-ui/react-popover`
- `@radix-ui/react-select`
- `@radix-ui/react-tooltip`
- `@radix-ui/react-tabs`

**图标库**：
- `lucide-react` - 主要图标库
- `@universe-design/icons-react` - 企业图标

### 5.3 动画方案

**Motion (Framer Motion)**：
```tsx
import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

**Lottie 动画**：
```tsx
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

<DotLottieReact
  src="/animations/loading.lottie"
  loop
  autoplay
/>
```

---

## 6. 开发流程

### 6.1 创建新组件

1. **创建文件夹结构**
```bash
mkdir -p src/components/my-component
cd src/components/my-component
touch index.tsx README.md CHANGELOG.md
```

2. **编写组件代码**
```tsx
// index.tsx
import React from 'react';

interface MyComponentProps {
  // Props 定义
}

export const MyComponent: React.FC<MyComponentProps> = (props) => {
  // 组件实现
  return <div>My Component</div>;
};
```

3. **填写文档**
- 完善 README.md（包含作者信息）
- 初始化 CHANGELOG.md

4. **导出组件**
```tsx
// src/components/index.ts
export { MyComponent } from './my-component';
```

### 6.2 代码审查清单

- [ ] Props 类型定义完整
- [ ] 包含 README.md 和 CHANGELOG.md
- [ ] 作者信息已填写
- [ ] 优先使用 Tailwind CSS
- [ ] 组件高内聚低耦合
- [ ] 无硬编码业务逻辑（基础组件）
- [ ] 响应式设计已考虑
- [ ] 可访问性（a11y）已考虑

---

## 7. 最佳实践

### 7.1 性能优化

**使用 memo 避免不必要的重渲染**：
```tsx
import { memo } from 'react';

export const ExpensiveComponent = memo<ExpensiveComponentProps>(
  ({ data }) => {
    // 组件实现
  },
  (prevProps, nextProps) => {
    // 自定义比较逻辑
    return prevProps.data.id === nextProps.data.id;
  }
);
```

**使用 useMemo 缓存计算结果**：
```tsx
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value);
}, [data]);
```

**使用 useCallback 缓存回调函数**：
```tsx
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);
```

### 7.2 可访问性 (a11y)

```tsx
<button
  aria-label="Close dialog"
  aria-pressed={isPressed}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Close
</button>
```

### 7.3 错误处理

```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary';

<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>
```

### 7.4 TypeScript 最佳实践

```tsx
// ✅ 使用 interface 定义 Props
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

// ✅ 使用泛型
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

// ✅ 使用联合类型
type Status = 'idle' | 'loading' | 'success' | 'error';

// ✅ 使用 Partial 和 Required
type PartialProps = Partial<ButtonProps>;
type RequiredProps = Required<ButtonProps>;
```

---

## 8. 示例模板

### 8.1 基础组件模板

```tsx
// src/components/ui/card/index.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'rounded-lg border border-line-border-card bg-bg-content-base shadow-sm',
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  className,
  padding,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(cardVariants({ padding }), className)}
      {...props}
    >
      {children}
    </div>
  );
};

// 子组件
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn('mb-4', className)} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn('text-text-caption', className)} {...props} />
);
```

### 8.2 业务组件模板

```tsx
// src/components/user-profile/index.tsx
import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { userAtom } from '@/store/atoms/user';
import { cn } from '@/lib/utils';

interface UserProfileProps {
  userId: string;
  onUpdate?: (data: UserData) => void;
  className?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onUpdate,
  className,
}) => {
  const [user, setUser] = useAtom(userAtom);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserData | null>(null);

  useEffect(() => {
    // 加载用户数据
    fetchUserData(userId).then(setFormData);
  }, [userId]);

  const handleSave = async () => {
    if (!formData) return;
    
    try {
      await updateUser(formData);
      setUser(formData);
      onUpdate?.(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  if (!formData) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('w-full max-w-md', className)}
    >
      <Card>
        <h2 className="text-text-title mb-4 text-xl font-bold">{formData.name}</h2>
        <p className="text-text-caption mb-4">{formData.email}</p>

        <div className="flex gap-2">
          <Button
            variant={isEditing ? 'primary' : 'secondary'}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          
          {isEditing && (
            <Button onClick={handleSave}>
              Save
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// 辅助函数
async function fetchUserData(userId: string): Promise<UserData> {
  // API 调用
  return {} as UserData;
}

async function updateUser(data: UserData): Promise<void> {
  // API 调用
}
```

### 8.3 README.md 完整示例

```markdown
# UserProfile

## 概述
用户资料卡片组件，支持查看和编辑用户信息。

## 作者
- **姓名**: 张三
- **邮箱**: zhangsan@bytedance.com
- **创建日期**: 2026-01-27

## Props

| 属性名 | 类型 | 必需 | 默认值 | 描述 |
|--------|------|------|--------|------|
| userId | string | 是 | - | 用户 ID |
| onUpdate | (data: UserData) => void | 否 | - | 更新成功回调 |
| className | string | 否 | - | 自定义类名 |

## 使用示例

\`\`\`tsx
import { UserProfile } from '@/components/user-profile';

function App() {
  const handleUpdate = (data) => {
    console.log('User updated:', data);
  };

  return (
    <UserProfile
      userId="123"
      onUpdate={handleUpdate}
      className="mx-auto"
    />
  );
}
\`\`\`

## 依赖
- `@/components/ui/card` - 卡片组件
- `@/components/ui/button` - 按钮组件
- `jotai` - 状态管理
- `motion` - 动画效果

## 状态管理
使用 Jotai 的 `userAtom` 管理用户全局状态。

## 注意事项
- 需要在应用中配置 Jotai Provider
- 确保 API 端点已正确配置
- 组件内部处理加载和错误状态

## 可访问性
- 支持键盘导航
- 提供适当的 ARIA 标签
```

---

## 📚 参考资源

- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Motion 文档](https://motion.dev/docs)
- [Jotai 文档](https://jotai.org/)
- [Radix UI 文档](https://www.radix-ui.com/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

## 🔄 版本历史

### v1.0.0 (2026-01-27)
- 初始版本发布
- 定义组件结构规范
- 确立技术栈和最佳实践
