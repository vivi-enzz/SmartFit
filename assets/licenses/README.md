# Third-party visual assets

## Editorial photography

Ten real photographs downloaded from Unsplash image CDN and optimized locally to WebP. The original download URL and license are recorded per file in `frontend/public/editorial/credits.json` and presented at `/credits`.

License: https://unsplash.com/license (checked 2026-11-09). Photographs are editorial inspiration, not product evidence, user testimonials, or endorsements by the depicted people. Images and credited source URLs are retained with the project; no generated people or scraped social accounts are used.

## Anatomical digital mannequin

`frontend/public/models/atelier-body.glb` derives solely from MakeHuman graphical assets released under CC0:

- Base mesh: https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/3dobjs/base.obj
- Morph: https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/targets/macrodetails/caucasian-female-young.target
- License: https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md

Both source asset headers explicitly state the CC0 release. A copy of the upstream license explanation is included in `MakeHuman-LICENSE.md`. No MakeHuman program source is included. SmartFit applies the female morph, extracts the body geometry, relaxes the A-pose arms, normalizes height, calculates normals and packages the result as GLB: 13,380 vertices / 26,756 triangles. Styling, hair, eyes, materials and garments are rendered by the application. This is a digital model, not a body scan or physical cloth simulation.

## 2.2 日常穿搭与室内摄影

`frontend/public/shopping/credits.json` 记录七张 Unsplash 照片的作者、正式图片页面、原始图片地址及许可。图片等比缩放/转为WebP，展示时可能裁切。仅作编辑风格与空间参考，不表示照片人物为用户/代言人，也不是照片服装的精确商品售卖。来源许可：https://unsplash.com/license 。
