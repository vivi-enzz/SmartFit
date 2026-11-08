# 本地演示 API

响应为 JSON，失败返回 `{ "error": "可读错误信息" }`。认证使用 HttpOnly cookie，凭据不放在 localStorage。所有写操作校验同源 Origin（存在时），身体数据需明确同意。地址与示例店铺不应填写或解释为真实业务数据。

| 方法和路径 | 功能 |
| --- | --- |
| GET /api/health | 演示模式和 SQLite 状态 |
| GET /api/catalog | 面料、参数、价格规则信息、供应商演示状态 |
| POST /api/auth/demo | 创建独立演示用户和会话 |
| POST /api/auth/register | name/email/password 注册 |
| POST /api/auth/login | email/password 登录 |
| POST /api/auth/logout | 删除当前会话 |
| GET /api/auth/me | 当前用户，未登录时为 null |
| GET/POST /api/designs | 当前用户设计列表/创建（name、config） |
| GET/PUT/DELETE /api/designs/:id | 当前用户设计读取/更新/删除 |
| GET/PUT/DELETE /api/metrics | 身体数据；PUT 必须包含 consent:true 和 metrics |
| GET /api/homepage-recommendations?city=Hong%20Kong | 城市推荐，simulateFailure=1 使用降级 |
| GET /api/search?q=亚麻 | 本地帖子/面料/作者搜索 |
| POST /api/captions | config → 本地可编辑文案，simulateFailure:true 标记 fallback |
| GET /api/partners?city=Hong%20Kong | 虚构店铺；同时传 lat/lon 时按 5 km 筛选 |
| GET/POST /api/posts | 列表/发布，支持 category/q；发布含 caption、category、designId 或 config，可选 imageUrl |
| GET /api/posts/:id | 详情、关联配置和评论 |
| POST /api/posts/:id/like | 当前用户点赞切换 |
| POST /api/posts/:id/comments | content 评论 |
| POST /api/uploads | multipart/form-data 的 image；解码 JPEG/PNG/WebP ≤5 MB |
| POST /api/orders | designId/address/idempotencyKey；服务端计价和配置快照 |
| GET /api/orders | 当前用户订单列表 |
| GET /api/orders/:id | 当前用户订单、状态历史与模拟物流 |
| POST /api/orders/:id/pay | 演示付款，outcome 为 success/failed，可选 eventId 去重 |
| POST /api/orders/:id/advance | 依次推进 paid → in_production → shipped → delivered |
| POST /api/orders/:id/cancel | 仅取消 pending_payment |
| GET /api/notifications | 当前用户应用内模拟通知 |
| GET /api/account/export | 当前用户个人数据，不包含密码哈希或会话密钥 |

会话有效期为两小时。开发代理和生产服务同源使用；不提供跨域访问许可。演示支付及推进接口只代表本版演示用途，接入真实支付前必须替换整个模拟事件入口与权限模型，不可直接作为生产 webhook。
