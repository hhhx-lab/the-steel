# 铁子

面向健身小白的 AI 健身房上手 App。

核心口号：

> 拍一下器械，小铁带你练。

## 本地运行

```bash
npm install
npm run dev
```

默认启动地址：

```text
http://localhost:5173/
```

## 已实现范围

- React + TypeScript + Vite + PWA
- 移动端优先页面框架
- 欢迎页、首页、拍器械页、识别结果页、动作教程页、训练中页、记录页、我的页
- Zustand 本地业务状态
- TanStack Query 基础查询层
- 前后端分离 API 门面：默认 mock，后续可切真实接口
- Mock 器械识别、动作库、今日训练和一句话记录解析
- 无真实后端时可完整演示核心闭环

## 文档

- `docs/01-page-design-and-flow.md`：页面设计与整体流转
- `docs/02-page-functional-spec.md`：页面功能、组件交互与接口说明
- `docs/03-frontend-architecture-api-plan.md`：前端架构、技术栈与接口计划

## 接口模式

默认使用 mock：

```text
VITE_USE_REAL_API=false
```

后端完成后可以在 `.env.local` 中切换：

```text
VITE_USE_REAL_API=true
VITE_API_BASE_URL=http://localhost:3000
```

## 验证

```bash
npm run build
```
