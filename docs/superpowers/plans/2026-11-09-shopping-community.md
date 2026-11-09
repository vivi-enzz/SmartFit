# SmartFit 2.2 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, then one fresh whole-branch review.

**Goal:** 暖色交互试衣间、深色服装设计台，以及可购物的日常内容社区。
**Architecture:** 保持同源Vue/Express和现有配置快照，新增卫衣合法配置与程序几何。摄影与风格商品配置分离。
**Tech Stack:** Vue 3, Three.js, Express, SQLite.
**Spec:** docs/superpowers/specs/2026-11-09-shopping-community-design.md

## Global Constraints
繁體/English；旧价格及订单兼容；同源和SafariHTTP策略不变；不伪造UGC、库存或互动。

## Review Focus
路由初始化不丢设计；撤销后编辑清除redo；卫衣非法组合被后端拒绝；无WebGL仍显示新增款式；图库来源与关联风格商品不被误认为精确实物。

### Task 1: 服装与编辑状态
- [x] 新增卫衣验证/69800报价、衣服独立展示几何、2D回退与订单快照回归；先失败再实现。
- [x] 建立 bounded history API（reset/record/undo/redo），测试分支、去重、40步上限与初始化。
- [x] Studio加入视图切换、即时色盘、撤销重做，并维持原保存/下单。

### Task 2: 商品和内容社区
- [x] 建立真实配置支撑的风格商品目录，验证每项合法、报价和路由；本地摄影有来源。
- [x] 首页商品卡/横向类目；社区紧凑信息流、内容类型筛选和可定制入口，详情标签/收藏，实际用户上传不变。
- [x] 更新授权页和繁體/English，增加SSR新控件/卡片检查。

### Task 3: 交付
- [x] 完整测试、构建、HTTP生产smoke；独立审阅并修复重要问题。
- [x] 版本2.2.0、文档与更新指引；以expected SHA上传GitHub，无托管部署。

## Ledger
Pre-flight: hoodie配置由shared/catalog提供给几何/2D/后端，所有展示及快照消费同一规范。商品配置透过query product id加载，价格使用shared报价，照片不覆盖配置。

Task 1: hoodie rules/geometry and history tests RED→GREEN (4/4). Task 2: source/valid configuration tests RED→GREEN (2/2). UI SSR and API hoodie snapshot added; initial API total-field test corrected to existing amount contract.
Final review: 4 findings fixed in one pass. Plain draft restore and explicit login product-resume each reproduced by real Vue lifecycle tests RED→GREEN; stale undo during pending metrics reproduced and fixed RED→GREEN. Fallback SVG is now explicitly positioned over the photographic background; no browser paint verification available.

Final: suite69/69, production build PASS, HTTP smoke1/1, locale audit empty, git diff --check clean. Browser QA unavailable. Source is published via authorized GitHub update, no hosted deployment.
