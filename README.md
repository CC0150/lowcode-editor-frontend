# 🚀 AI Low-Code Form Engine (智能可视化表单引擎)

![React](https://img.shields.io/badge/React-19.x-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8.x-purple?style=flat-square&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwind-css)
![Zustand](https://img.shields.io/badge/Zustand-State_Management-yellow?style=flat-square)

> 一个基于 **JSON Schema 驱动** 的企业级低代码表单构建平台。支持可视化拖拽编排、动态逻辑联动（Show/Hide）、以及一键编译导出 React 源码。

## ✨ 项目亮点 (Core Features)

本项目脱离了简单的"UI拼接"，深入探索了低代码领域的核心架构，具备以下极具含金量的特性：

- 🧱 **所见即所得的可视化搭建 (Visual Builder)**
  - 基于 `@dnd-kit/core` 构建的高性能拖拽引擎，支持虚拟列表与平滑过渡动画。
  - 通过 `PointerSensor` 精准拦截并处理点击与拖拽的事件冲突。
- 📝 **基于 JSON Schema 的协议驱动 (Schema-Driven)**
  - 核心状态完全由 `ComponentSchema` 协议描述，实现视图层与数据层的完美解耦 (`View = f(State)`)。
  - 基于 Zustand 实现轻量级、无渲染抖动的全局配置树更新。
- 🧠 **表单联动规则沙箱 (Dynamic Logic Engine)**
  - 实现组件级的关联逻辑（如：当问题 A 选中"其他"时，动态渲染问题 B）。
  - 利用 React 受控模型配合底层状态机，实现复杂的表单级联渲染与数据收集。
- ⚡ **微型 AST 源码生成器 (Code Generation)**
  - 内置简易编译器，可将画布中的 JSON 配置结构，"降维编译"为无依赖的标准化 React 函数式组件源码（含完整的 `useState` 绑定与条件渲染逻辑）。
- 🤖 **AI 智能生成 (AI Generator)**
  - 集成 AI 能力，可根据自然语言描述自动生成表单结构。
- 🌐 **表单分享 (Share Page)**
  - 支持生成可分享的表单链接，方便他人填写。
- 📱 **响应式设计 (Responsive)**
  - 适配不同屏幕尺寸，提供良好的移动端体验。

## 🛠️ 技术栈 (Tech Stack)

- **框架:** React 19 (Functional Components + Hooks)
- **构建工具:** Vite
- **类型系统:** TypeScript
- **状态管理:** Zustand (比 Redux 更轻量，完美契合 JSON 树更新)
- **样式方案:** Tailwind CSS v4 (CSS-first 方案)
- **拖拽引擎:** @dnd-kit (现代化的 React 拖拽解决方案)
- **UI 组件库:** Antd
- **图标库:** Lucide React
- **工具库:** clsx, dayjs, immer, jsonrepair, qrcode.react, react-error-boundary, react-router-dom, tailwind-merge, uuid, zod

## 📂 核心目录结构

```text
├── src/
│   ├── components/
│   │   ├── FormPreview.tsx     # 核心：受控表单渲染引擎（双向绑定+逻辑解析）
│   │   ├── SetterPanel.tsx     # 属性配置面板（表单项控制、动态选项增删）
│   │   ├── SortableWrapper.tsx # dnd-kit 拖拽包装器
│   │   ├── ExportModal.tsx     # AST 代码编译器与 JSON 导出模块
│   │   ├── PublishModal.tsx    # 表单发布与分享模块
│   │   ├── AIGenerator.tsx     # AI 智能生成表单模块
│   │   ├── EditorCanvas.tsx    # 编辑器画布
│   │   ├── LeftSidebar.tsx     # 左侧组件库
│   │   └── RightSidebar.tsx    # 右侧属性面板
│   ├── store/
│   │   ├── useEditorStore.ts   # Zustand 全局 JSON Schema 状态中心
│   │   └── useUIStore.ts       # UI 状态管理
│   ├── types/
│   │   └── editor.ts           # 核心领域模型（DSL 协议定义）
│   ├── utils/
│   │   ├── request.ts          # 网络请求工具
│   │   └── validation.ts       # 表单验证工具
│   ├── App.tsx                 # 主页面（三栏布局、DndContext 上下文）
│   ├── EditorLayout.tsx        # 编辑器布局组件
│   └── main.tsx                # 应用入口
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── .env.development            # 开发环境配置
├── .env.production             # 生产环境配置
├── package.json                # 项目依赖与脚本
└── vite.config.ts              # Vite 配置
```

## 🚀 快速开始 (Getting Started)

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 🎯 核心功能使用指南

### 1. 可视化拖拽搭建

- **左侧组件库**：包含多种表单组件（文本框、单选框、复选框、下拉选择等）
- **中间画布**：通过拖拽方式添加、排序、删除组件
- **右侧属性面板**：配置组件的详细属性（标签、默认值、是否必填、验证规则等）

### 2. 表单联动规则

- **可见性规则**：设置组件的显示/隐藏条件，基于其他组件的值
- **逻辑表达式**：支持简单的条件判断，实现复杂的表单逻辑

### 3. AI 智能生成

- **自然语言描述**：输入表单需求的自然语言描述
- **AI 生成**：系统自动生成符合需求的表单结构
- **一键应用**：将生成的表单结构应用到画布

### 4. 源码导出

- **React 源码**：导出为标准的 React 函数式组件
- **JSON 配置**：导出表单的 JSON 配置文件
- **无依赖**：生成的代码不依赖任何外部库，可直接使用

### 5. 表单发布与分享

- **生成分享链接**：创建可访问的表单链接
- **二维码分享**：生成二维码，方便移动端访问
- **数据收集**：收集并存储用户提交的表单数据

## 📝 组件类型支持

| 组件类型 | 描述 | 支持的属性 |
|---------|------|-----------|
| 文本框 | 单行文本输入 | 标签、占位符、默认值、是否必填、验证规则 |
| 多行文本 | 多行文本输入 | 标签、占位符、默认值、是否必填、验证规则 |
| 数字输入 | 数字类型输入 | 标签、占位符、默认值、是否必填、最小值、最大值、步长 |
| 单选框 | 单选选择 | 标签、选项列表、默认值、是否必填 |
| 复选框 | 多选选择 | 标签、选项列表、默认值、是否必填 |
| 下拉选择 | 下拉菜单选择 | 标签、选项列表、默认值、是否必填 |
| 日期选择 | 日期选择器 | 标签、默认值、是否必填、日期范围 |
| 开关 | 布尔值开关 | 标签、默认值 |

## 🔧 自定义配置

### 环境变量

- **.env.development**：开发环境配置
- **.env.production**：生产环境配置

### 扩展组件

1. 在 `src/types/editor.ts` 中定义新的组件类型
2. 在 `src/components/FormControl.tsx` 中添加组件渲染逻辑
3. 在 `src/components/LeftSidebar.tsx` 中添加到组件库

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- **项目地址**：https://github.com/CC0150/lowcode-editor-frontend.git
- **问题反馈**：https://github.com/CC0150/lowcode-editor-frontend/issues

---

**⭐ 如果你觉得这个项目有帮助，请给它一个星标！**