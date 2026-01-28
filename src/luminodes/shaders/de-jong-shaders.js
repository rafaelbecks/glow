// WebGL shaders for the De Jong attractor luminode
// Ported from Mike Bostock's "de Jong Attractor II" Observable notebook,
// with minor adjustments for our engine (point size + color mode).

export const DE_JONG_VERTEX_SHADER = `
precision highp float;

const float PI = 3.14159265359;

attribute vec2 a_position;

uniform float u_a;
uniform float u_b;
uniform float u_c;
uniform float u_d;
uniform float u_pointSize;
uniform float u_scale;

varying float v_t;

void main() {
  float x1, x2 = a_position.x;
  float y1, y2 = a_position.y;

  // Iterate the De Jong map a fixed number of times
  for (int i = 0; i < 8; i++) {
    x1 = x2;
    y1 = y2;
    x2 = sin(u_a * y1) - cos(u_b * x1);
    y2 = sin(u_c * x1) - cos(u_d * y1);
  }

  // Angle of original seed controls rainbow color
  v_t = atan(a_position.y, a_position.x) / PI;

  // Project attractor into clip space with scale applied
  gl_Position = vec4(x2 / 2.0 * u_scale, y2 / 2.0 * u_scale, 0.0, 1.0);
  gl_PointSize = u_pointSize;
}
`

export const DE_JONG_FRAGMENT_SHADER = `
precision highp float;

const float PI = 3.14159265359;

varying float v_t;

uniform int u_colorMode;   // 0 = rainbow, 1 = MIDI, 2 = black & white
uniform vec3 u_midiColor;  // Used when u_colorMode == 1
uniform float u_time;      // Time-based phase for rainbow animation

vec3 cubehelix (float x, float y, float z) {
  float a = y * z * (1.0 - z);
  float c = cos(x + PI / 2.0);
  float s = sin(x + PI / 2.0);
  return vec3(
    z + a * (1.78277 * s - 0.14861 * c),
    z - a * (0.29227 * c + 0.90649 * s),
    z + a * (1.97294 * c)
  );
}

vec3 rainbow (float t) {
  if (t < 0.0 || t > 1.0) t -= floor(t);
  float ts = abs(t - 0.5);
  float x = (360.0 * t - 100.0) / 180.0 * PI;
  float y = 1.5 - 1.5 * ts;
  float z = 0.8 - 0.9 * ts;
  return cubehelix(x, y, z);
}

void main() {
  if (u_colorMode == 1) {
    // MIDI-driven color (from JS uniform)
    gl_FragColor = vec4(u_midiColor, 1.0);
  } else if (u_colorMode == 2) {
    // Black & white mode: use intensity based on position angle
    float intensity = (v_t + 1.0) * 0.5; // Map [-1, 1] to [0, 1]
    gl_FragColor = vec4(intensity, intensity, intensity, 1.0);
  } else {
    // Rainbow mode (0) with a gentle time-based phase shift,
    // preserving the original v_t mapping but making the colors flow over time.
    float t = v_t / 4.0 + 0.25 + u_time * 0.05;
    gl_FragColor = vec4(rainbow(t), 1.0);
  }
}
`

