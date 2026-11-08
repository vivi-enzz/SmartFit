# 素材与来源

2.0 使用真实摄影与详细人体资产，实际静态文件位于 `frontend/public/`，由开发和生产服务同源提供。

- `frontend/public/editorial/`：10 张经 WebP 压缩的真人/服装摄影，原始 CDN URL 与许可见 `credits.json`。
- `frontend/public/models/atelier-body.glb`：由 MakeHuman CC0 图形资产处理得到的数字人体。
- `assets/licenses/`：来源、许可与模型处理说明。
- 网站 `/credits`：对用户展示的素材说明页。

用户自己上传的文件仍保存在被 Git 忽略的 `backend/data/uploads/`，不会随源码上传。程序化服装 SVG 仅用于个人设计卡片及无 WebGL 降级，不再作为官方摄影社区的默认素材。
