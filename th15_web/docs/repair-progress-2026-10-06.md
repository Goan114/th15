# TH15 repair progress — paused at user request

The user requested completing the current original-glyph sampling/clarity change, then pausing until they say to continue. Do not resume other repairs or high-refresh work without that instruction.

## Workspaces and updates

- Shared Launcher `eagler-touhou/main` fast-forwarded to f5c2855. Original local changes to the TH20 catalog/card were preserved. The precautionary stash remains available.
- Original `th15/main` remains at fe113b6.
- Canonical adapter `th15-eagler/eagler` remains at d6ea682.
- All repair changes are uncommitted in `_scratch/th15-render-loading-cadence`, branch `fix/th15-render-loading-cadence`, based on d6ea682. They have not been merged, packaged or published.

## Current visual change

Preserve original atlas/font shapes. Add a physical raster grid without changing logical coordinates; snap pixel quads to that grid and retain the logical half-pixel offset expected by the transformed vertex shader. At 2x, unscaled ASCII glyphs use nearest sampling to avoid a second blur. GPU screenshot/blank targets use the render scale. Scaled ARGB4444 font textures retain dirty-rectangle uploads.

The original low-resolution atlas still determines the amount of detail. The user explicitly selected preserving original glyph shapes over remaking the font atlas.

## Other drafts already in the worktree

- Loading signature environment avoids applying the authored half-scale twice. Isolated loading graphics include the original prayer artwork and correct inherited blending. Game/stage preparation is deferred until after a visible loading frame, with the RAF catch-up loop yielding at that boundary. Managed and shared shells paint initial loading before initialization.
- Stage Clear consumes its 120-frame outgoing HUD delay before constructing the arriving stage; player motion remains active during the outgoing display.
- LZSS encoding is resumable; Pointdevice compression is pumped in bounded chunks with a time budget. This needs persistent checkpoint, retry, cold-start and mobile performance validation before integration. Snapshot capture/serialization is still synchronous.

## Evidence

- Development C++ build passed. Last measured Wasm: 1998ace7857d6ad520190dffc4c5caebc10fa3079a01b8d3fda6abe7e2e3c352 (2206224 bytes). Line endings were subsequently restored to match unchanged source lines; rebuild the exact final source for package identity.
- Original versus incremental LZSS: 220 byte comparisons plus round trips passed for multiple patterns, sizes through 262144 bytes and budgets 1/3/17/4096/131072. Utility source/results are in ignored `th15_web/artifacts/codec-check`.
- `TH15_ORIGINAL_DAT=<private original dat> node --test th15_web/tests/sdl/render-loading-lifecycle-browser.test.mjs` uses Chromium, real archive and private measured fonts, at 1280x960. It verifies initial/game/stage loading boundaries and player movement throughout Stage Clear. Music is disabled. Latest run additionally visits Replay and Player Data. Reports/screenshots are in ignored `artifacts/cpp/verification`.
- These desktop checks do not prove stable 60 FPS on mobile; do not claim the performance items are completed.

## Resume

Finish review and validation of the other drafts, particularly natural spell/chapter transitions, Pointdevice persistence and full scene lifecycle. Compare profiling against the clean canonical development build already saved in `th15-eagler/th15_web/artifacts/sdl-application`. High-refresh is untouched and must be last, in its own experiment lane as required by EAGLER.md and the shared interpolation playbook. Integrate only verified changes into the canonical adapter and build/package it there.

Pinned SDK is at `th08/tools/emsdk` (6.0.9); set TH15_EMSDK. Private measured fonts were generated from actual Windows GDI in this scratch worktree. Their tracked manifest was restored; before delivery reconcile private font hashes/provenance. Node dependency junctions in `th08_web` and `th10_web` point to `th11/th08_web/node_modules`.
