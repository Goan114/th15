# Mobile persistent trails: exact capture-copy candidate

## Scope and evidence

- Eagler baseline: `4ec0521`; topic: `fix/th15-mobile-ghosting`.
- User reports persistent bullet/player trails on the main site, particularly
  stage 6 meteors, with high refresh disabled. Earlier reports also involve
  Chapter Finish and multiple mobile browser/device vendors.
- Read-only main-site inspection found runtime generation
  `c362dc91eb40c6671a631d46a0c826dd9f1cae41ae2f8c7d51cb09eb6be6c072`,
  built 2026-10-14, Wasm SHA-256
  `04997d10d7d71de0382fe6e9bd40c00a646fd10975a095cffe8d89557be05ad8`.
- Desktop did **not** reproduce the reported mobile failure. This is a
  conservative alternate capture path requiring physical-device acceptance,
  not proof of a particular mobile driver defect or a confirmed final fix.

## Change

The integrated checkout also advances its own `third_party/eagler-common` lock
from `52bc86f` to `b8843c2`. The baseline already uses `PracticePointer::TouchRoute`
and `route_touch`, absent from the former lock. Its default full build failed
there before this renderer change; the topic initially built against the same
updated workspace common library. The shared workspace repository and other
titles' dependency locks are unchanged.

Recognize only exact, unblended, unmodulated, axis-aligned, integer, 1:1
screen-space copies between distinct, same-format/same-scale GPU surfaces.
Transfer their color pixels using `glBlitFramebuffer` rather than the shader /
blend-state rasterization path. Retain texture/render-target revision ownership
and framebuffer binding caches. This bypass also applies when PresentationFrame
replays the original immutable draw packet.

Any fade, tint, mask, fog, depth comparison/write, scaling, reflection, rotation,
partial viewport clipping, fractional coordinates, or different format/scale
continues through the existing rasterizer. There is no new frame clear,
`glFinish`, pixel readback, simulation modification, or chapter/stage special case
in production. This affects only this repository's renderer; no other title or
site is changed.

## Verification

The graphics fixture now resolves the shared THPrac include directory and uses
a response file for long Windows link commands, like the application builder.

```powershell
node th15_web/scripts/build-sdl-graphics.mjs
node --test th15_web/tests/sdl/graphics-browser.test.mjs
node --test th15_web/tests/sdl/chapter-composite-browser.test.mjs
node th15_web/scripts/build-sdl-application.mjs --thprac
$env:TH15_CAPTURE_INPUT = '<private import tree: games/th15/th15.dat + shared/unifont.otf>'
$env:TH15_CAPTURE_FONTS = '<private font0-7/cp932/blend4444 directory>'
node --test th15_web/tests/sdl/application-mobile-capture-browser.test.mjs
node th15_web/scripts/build-sdl-application.mjs --release --thprac
```

Chapter regression: 340 frames of original `front.anm` script 241 and `text.anm`
capture scripts, with/without the new transfer path. Compare every RGBA pixel
at 17 checkpoints at both render scales, with/without `EXT_clip_control`.
Require actual framebuffer transfers and no previous moving marker pixels.

Application regression: actual stage 3 (1x) and stage 6 (2x), each for 7,200
ticks, plus stage 6 repeated-presentation coverage. Includes original STD/ECL,
real projectiles, chapter animation and THPrac/ImGui. A unique moving marker is
drawn before playfield composition, and must not accumulate. The real camera,
masks and dialogue may cover it; some samples must show the whole marker.
Test-only invulnerability isolates graphics from unattended deaths.

Local evidence is under ignored `th15_web/artifacts/cpp/verification/`.
Desktop NVIDIA/ANGLE evidence, even with a mobile viewport/touch setting, is not
physical Android evidence. Main/beta/test deployment and mobile acceptance are
not implied by these checks.

Integrated checkout validation (2026-10-16): graphics and chapter tests passed
(5 tests), and the real-stage regression passed all three scenarios. Both
development and release builds with THPrac succeeded after dependency alignment.
The release contains no capture-test exports. Release Wasm SHA-256:
`90e9d889934866183da1cf7bbe7a5f3a090118af43bc60375754dc4b2f80e118`.
Physical-device confirmation remains pending; no site was deployed.
