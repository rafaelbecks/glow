# Canvas shader backgrounds

All full-screen canvas backgrounds are coordinated by **`ShaderBackgroundManager`** (`src/shader-background-manager.js`), which combines:

1. **Fluid engine** — `fluid-background-engine.js` — GPU-io particle / pressure / velocity simulation (same stack as [gpu-io](https://github.com/amandaghassaei/gpu-io) examples).
2. **Procedural engine** — `procedural-background-engine.js` — WebGL2 full-screen triangle passes, driven by small **module** files under `procedural/`.

Luminode-style **registry**: procedural modes are listed in `procedural/index.js`. The UI mode dropdown is built from `getBackgroundModePaneOptions()` in `registry.js`.

## Adding a new Shadertoy-style background

1. **Create a module** in `procedural/your-shader.js` exporting an object:

   - **`modeValue`** — string stored in `SETTINGS.CANVAS.SHADER_BACKGROUND_MODE` (PascalCase, no spaces).
   - **`displayLabel`** — human-readable label for the Tweakpane dropdown.
   - **`needsFeedback`** — `true` only if the fragment shader samples a previous frame (e.g. `iChannel0`). The engine allocates ping-pong RGBA8 targets and binds `sampler2D u_feedback`.
   - **`vertexSource`** — usually `FULLSCREEN_TRIANGLE_VERTEX` from `glsl/fullscreen-triangle.vert.js`.
   - **`fragmentSource`** — full GLSL ES 3.00 fragment shader (`#version 300 es`, `out vec4 fragColor`, use `u_resolution` / `u_time` instead of `iResolution` / `iTime`).
   - **`uniformNames`** — list of `uniform` names for `getUniformLocation`.
   - **`applyUniforms(gl, uniforms, canvasSettings, width, height, timeSeconds)`** — set uniforms from `SETTINGS.CANVAS` keys you define.

2. **Register the module** — append your export to the `PROCEDURAL_BACKGROUND_MODULES` array in `procedural/index.js`.

3. **Defaults** — add any new keys to `SETTINGS.CANVAS` in `src/settings.js`.

4. **Project save/load** — add keys to `project-manager.js` (`collectProjectState` canvas section and the `procKeys` array in `applyCanvasSettings`).

5. **UI** — in `canvas-ui-manager.js`, add Tweakpane bindings under a new folder, assign `shaderBgParamFolders.yourKey = folder`, and extend `refreshShaderBackgroundParamVisibility` so that folder is visible when `mode === 'YourModeValue'`.

Attribution: many effects originate as [Shadertoy](https://www.shadertoy.com/) sketches; respect each author’s license when shipping or redistributing (e.g. CC-BY-NC-SA on some community shaders).
