# SmartFit · 合身，自有风格

SEEM5760 课程项目的完整本地演示版，依据 `SmartFit_SEEM5760_Final_Review.docx` 开发。将服装定制、3D 造型预览、穿搭社区、模拟支付和履约流程串联起来。

## 快速启动

需要 **Node.js 24+** 和 npm。无需数据库服务器或第三方 API 密钥。

```bash
cd smartfit-app
npm ci
npm run dev
```

打开 Vite 输出的本地地址（默认 `http://localhost:5173`）。开发时前端将 `/api` 和 `/media` 请求代理至 Express 的 3001 端口。

构建后可由单个服务运行：

```bash
npm run build
npm start
```

打开 `http://localhost:3001`。API 和静态前端同源，不需要启动 Vite。默认监听 `0.0.0.0`；仅在可信本地环境运行。使用 HTTPS 代理时设置 `COOKIE_SECURE=true`。

若 npm 默认缓存目录不可写，可使用工作区缓存，例如 `npm ci --cache ./work/npm-cache`。

## 演示路线

1. 在账户页点击“一键体验完整演示”，获得独立体验账户；也可注册账户便于再次登录。
2. 进入定制工作室，切换面料、颜色、廓形、领型、袖型、衣长与刺绣；3D 模型即时调整。
3. 在“我的身形”输入尺寸；主动同意并点击保存后，身体数据才会加密传到后端。无 WebGL 时使用二维预览。
4. 保存设计，在“我的设计”中重新打开、分享或下单。
5. 在社区使用本地文案模板、编辑文案、上传图片、发布、点赞和评论；从帖子定制同款。
6. 填写**虚构**收货信息并创建订单，测试模拟付款失败与成功。
7. 在订单页依次模拟制作、发货、签收，查看状态历史与物流时间线；账户页可查看模拟通知。
8. 查看附近服务示意，或在账户页导出个人数据和删除身体尺寸。

详细说明见 `docs/demo-guide.md`。

## 技术架构

- 前端：Vue 3、Vue Router、Vuex、Vite、Three.js。
- 后端：Node.js、Express、node:sqlite、bcryptjs、AES-256-GCM、Sharp。
- 运行存储：**SQLite**，首次启动创建 `backend/data/smartfit.sqlite`，缓存与限流为单进程内存。
- MySQL：提供 `backend/schema.mysql.sql` 迁移参考，**当前未接入**。Redis、AWS 及真实供应商服务也未接入。
- 鉴权：两小时有效的服务端会话，HttpOnly + SameSite cookie；密码 bcrypt 哈希；敏感接口核对用户归属。

订单价格在后端计算并以 HKD 最小货币单位存储。订单独立保存所购配置、报价和版本快照。模拟付款使用唯一事件和数据库事务去重，客户端不能直接改为任意订单状态。

## 文件结构

```text
smartfit-app/
├── frontend/src/       # 页面、组件、状态、样式
├── frontend/test/      # 逻辑和 Vue 编译/SSR 检查
├── backend/src/        # API、持久化、加密、演示服务
├── backend/test/       # 真实 SQLite API 集成测试
├── backend/schema.mysql.sql
├── shared/catalog.js   # 共享参数规则、面料与报价
├── docs/               # 设计、计划、演示、追踪及验证记录
├── assets/             # 可扩展的静态素材目录
├── .env.example
└── package.json
```

## 验证

```bash
npm test
npm run build
npm run test:production
```

测试使用临时独立 SQLite 数据库，不修改演示运行数据。测试内容及当前限制见 `docs/verification.md`。Vue SSR 检查不替代浏览器交互或 WebGL 验证。

## 数据与配置

默认加密密钥首次生成后保存在 `backend/data/secret.key`，权限为 0600，随数据目录一起被 Git 忽略。**备份数据库时也需备份密钥**，否则无法恢复身体数据。不要将密钥、数据库、上传文件或 `.env` 提交到版本库。`DATA_ENCRYPTION_KEY` 可覆盖默认密钥，需为 64 位十六进制；已有数据不要随意更换密钥。

Node 不会自动加载 `.env`。可复制 `.env.example` 为 `.env`，使用 `node --env-file=.env backend/src/server.js` 加载，或通过操作系统设置环境变量。`DATA_DIR` 指定数据目录，`PORT` 指定 API/生产服务端口。改变开发 API 端口时，需相应调整 `vite.config.js` 代理。

一键体验每次创建不同用户；退出后无法凭邮箱找回该演示账户，需持续使用或先导出数据。注册账户支持退出后重新登录。为展示图片分享，上传图片在用户主动上传同意后通过随机 URL 可公开访问；请勿上传敏感图片。

## 演示与生产的区别

九家外部供应商均使用明确标注的本地演示替代：OpenWeather 天气、Cloudinary 图片处理、Facebook 分享、Google Places 店铺、Stripe 支付、AfterShip 物流、Algolia 搜索、Twilio 通知、OpenAI 文案。应用不请求真实银行卡，不真实扣款、不发送短信、不发帖到外部平台，不向工厂发送订单。浏览器分享或复制链接由用户主动触发。

三维服装使用程序生成网格和比例调整，不进行物理布料模拟或真实合体预测。店铺为虚构示例，地图仅为位置示意。报告中的生产性能、可用性、可持续性收益和安全合规认证均未在此演示中验证。未自动部署或发布。
