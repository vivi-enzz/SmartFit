# 需求追踪与实现边界

| 需求 | 实现位置 | 验证/边界 |
| --- | --- | --- |
| US-01 / R-F1 定制与保存 | Studio.vue、shared/catalog.js、/api/designs | 颜色格式、兼容组合、服务端报价、持久化；无专业纸样生成 |
| US-02 / R-F2 情境推荐与搜索 | Home.vue、adapters.js、/api/search | 三种面料、城市切换、天气降级；非真实天气/Algolia |
| US-03 / R-F3 3D 与分享 | FittingRoom.vue、Community.vue、Post.vue | 程序化 3D 网格、尺寸比例、二维降级、编辑模板、用户触发分享；非物理试衣/OpenAI/Facebook |
| US-04 / R-F4 物流 | Orders.vue、/api/orders/:id/advance | 受控状态与历史、演示物流、应用内通知；不连接 AfterShip/Twilio |
| US-05 / R-F4 线下服务 | Partners.vue、/api/partners | 授权定位、手动城市、5 km 筛选、合作商标注；地图为示意、店铺为虚构 |
| R-F5 社区与交易 | Post/Community/Checkout.vue、posts/orders API | 上传、评论、点赞、关联设计、订单快照、支付事件去重；不连接 Cloudinary/Stripe |
| 身份与访问 | security.js、app.js auth/session | bcrypt、两小时会话、HttpOnly/SameSite、来源校验、限流、用户归属检查 |
| 身体数据隐私 | metrics API、Account.vue | 明确同意、AES-GCM、导出、身体数据删除；不声称全面法律合规认证 |
| 数据层 | store.js、schema.mysql.sql | 本版 SQLite 持久化；MySQL 为迁移参考，Redis/AWS 未接通 |
| 非功能指标 | style.css、测试与构建 | 响应式断点和键盘焦点样式已编写；真实浏览器、p95、99.5% 可用性和 WCAG 审计未验证 |

所有供应商替代信息在 /api/catalog 的 providers 中可读。源码中没有生产 API 密钥。报告中的支付签名 webhook、外部 OAuth、生产队列、制造系统对接、退款与异常补偿均不作为本地演示已实现能力。

## 2.0 补充

- `backend/src/development.js` 将 API 与 Vue 开发页面挂载于同一个 Express 服务，默认启动无需代理；`/api/health` 返回 `version: 2.0.0`。
- `frontend/src/i18n.js` 与 `locales/` 提供繁體/English 界面、动态提示与可持久语言选择；英文搜索和模板文案同时支持。
- `shared/editorial.js` 与官方种子 UPSERT 增加真实摄影精选，不删除私人内容。来源说明见 `/credits`。
- `FittingRoom.vue` 加载本地 CC0 解剖结构网格，配合 `avatarShape.js` 的人体和领口变形；仍非物理布料仿真或人体扫描。
- `scripts/update-local.sh` 用于用户 Mac 上的完整源码更新、源码备份和保留个人资料目录。
