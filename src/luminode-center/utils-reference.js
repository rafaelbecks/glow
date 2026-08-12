/**
 * Static reference for UTILS / canvas helpers available to luminode authors.
 */
export const UTILS_REFERENCE_HTML = `
<section class="luminode-center-utils-section">
  <h4>Reading settings</h4>
  <p>Use <code>MODULE</code> for this luminode’s settings (injected at runtime). Prefer it over hard-coded <code>SETTINGS.MODULES.*</code> keys.</p>
  <pre>const width = MODULE.LINE_WIDTH
const rot = MODULE.ROTATION</pre>
</section>

<section class="luminode-center-utils-section">
  <h4>Color — <code>UTILS</code></h4>
  <dl>
    <dt><code>UTILS.pitchToColor(midi)</code></dt>
    <dd>MIDI pitch → <code>hsla(...)</code> from <code>SETTINGS.COLORS.PITCH_PALETTE</code> (editable on Canvas tab). Falls back to hue-factor generation.</dd>
    <dt><code>UTILS.generatePitchPalette(factor?)</code></dt>
    <dd>Builds the pitch palette hex colors from a hue factor.</dd>
    <dt><code>UTILS.hexToRgba(hex, alpha?)</code></dt>
    <dd><code>"#rrggbb"</code> → <code>rgba(r,g,b,a)</code>.</dd>
    <dt><code>UTILS.hslaToRgb(hslaString)</code></dt>
    <dd>Returns <code>[r,g,b]</code> in 0–1 (useful for shaders).</dd>
  </dl>
</section>

<section class="luminode-center-utils-section">
  <h4>3D — <code>UTILS.rotate3D</code></h4>
  <pre>const [x2, y2, z2] = UTILS.rotate3D(x, y, z, angleX, angleY, angleZ)
// angles in radians</pre>
  <p>Project to 2D yourself (e.g. ignore <code>z</code>, or scale by depth).</p>
</section>

<section class="luminode-center-utils-section">
  <h4>Rotation helpers</h4>
  <dl>
    <dt><code>getEulerRotation(MODULE)</code></dt>
    <dd>Reads <code>MODULE.ROTATION</code> <code>{x,y,z}</code> in degrees → radians.</dd>
    <dt><code>isRotationEnabled(MODULE)</code></dt>
    <dd>True unless <code>ROTATION_ENABLED</code> is explicitly false.</dd>
  </dl>
</section>

<section class="luminode-center-utils-section">
  <h4>Layout — <code>canvasDrawer</code></h4>
  <pre>this.canvasDrawer.applyLayoutTransform(layout)
// draw in local space; origin is track center
this.canvasDrawer.restoreLayoutTransform()</pre>
  <p><code>layout</code> is <code>{ x, y, rotation }</code> (rotation in degrees). Also: <code>getContext()</code>, <code>getDimensions()</code> → <code>{ width, height }</code>.</p>
</section>

<section class="luminode-center-utils-section">
  <h4>Draw signature</h4>
  <pre>draw (t, notes, layout = { x: 0, y: 0, rotation: 0 })</pre>
  <ul>
    <li><code>t</code> — seconds</li>
    <li><code>notes</code> — <code>[{ midi, velocity, timestamp }, ...]</code> (<code>velocity</code> 0–1, <code>timestamp</code> from <code>performance.now()</code>)</li>
    <li><code>layout</code> — track position / rotation</li>
  </ul>
</section>

<section class="luminode-center-utils-section">
  <h4>Also available</h4>
  <p><code>SETTINGS</code> — global app settings (canvas, MIDI, etc.). Prefer <code>MODULE</code> for luminode params.</p>
</section>
`
