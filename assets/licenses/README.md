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
