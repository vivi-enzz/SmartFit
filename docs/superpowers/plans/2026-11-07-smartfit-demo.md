# SmartFit Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 本地运行的服装定制、社区与模拟履约完整演示。
**Architecture:** Vue SPA 经 /api 访问 Express；SQLite 持久化，九项第三方服务使用明确标注的演示适配器。
**Tech Stack:** Vue 3, Vue Router, Vuex, Three.js, Express, node:sqlite, bcryptjs, sharp, Vite, Node test runner.
**Spec:** docs/superpowers/specs/2026-11-07-smartfit-demo-design.md

## Global Constraints
- 中文 UI，HKD 整数分计价，不真实扣款或调用外部供应商。
- SQLite 为唯一运行数据库；MySQL schema 为迁移参考；缓存使用内存。
- 身体数据需同意并加密；订单快照不可变；支付事件幂等；API 校验归属。
- 本地开发，不自动发布。

## Review Focus
- 跨用户设计、订单、图片引用必须拒绝。
- 重复支付与重复提交不能生成重复付款或订单。
- 身体尺寸非数字、超范围与缺失同意必须拒绝。
- 上传伪造内容、过大图片和路径穿越必须拒绝。
- 服务重启后数据、密钥和订单历史必须保留。

### Task 1: API、身份和持久存储
**Files:** backend/src/{app,store,security,catalog,adapters}.js; backend/test/api.test.js; package.json
**Interfaces:** createApp({dataDir}) → Express app; same-origin /api; HttpOnly signed session cookie; catalog returns option rules and server price.
- [x] 编写并运行 API 集成测试：匿名访问拒绝、登录退出、独立演示账户、目录校验、保存重启和个人数据同意。
- [x] 实现用户、目录、设计、加密指标和演示适配器；npm test 应通过对应测试。

### Task 2: 社区与交易
**Files:** backend/src/{app,store}.js; backend/test/api.test.js
**Interfaces:** /api/posts, /api/orders, /api/orders/:id/pay, /api/orders/:id/advance；所有归属使用 session user。
- [x] 编写并运行测试：非法参数、跨账户读取、订单快照、幂等付款、非法状态、失败后重试、社区交互、上传限制。
- [x] 实现社区与图片、本地支付事件事务和履约时间线；npm test 全部通过。

### Task 3: Vue 前端与 3D
**Files:** frontend/src/{App,main,store,api}.js; frontend/src/views/*.vue; frontend/src/components/*.vue; frontend/src/style.css
**Interfaces:** 前端统一 api(path, options)；Vuex stores user/catalog；Vue Router 管理首页、工作室、设计、社区、结算、订单、服务与账户。
- [x] 先编写前端逻辑测试：价格、尺寸范围、3D 比例映射、订单状态展示和网络错误。
- [x] 实现页面、上传发帖、3D WebGL 与 SVG 降级、移动布局、错误反馈和空状态。
- [x] 运行 npm test 和 npm run build。

### Task 4: 交付与检查
**Files:** README.md, docs/{demo-guide,traceability,verification}.md, backend/schema.mysql.sql, .env.example
- [x] 运行全部测试、生产构建和 HTTP 冒烟验证；浏览器工具可用时执行关键流程与手机检查，不可用时如实记录。
- [x] 一次独立代码审阅，修复重要问题并添加回归测试。
- [x] 编写启动、功能边界、需求追踪与实际验证记录。
