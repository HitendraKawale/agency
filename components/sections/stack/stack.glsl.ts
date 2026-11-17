// Shaders for the stack (stack-scene.tsx), copied from rerun.io's Hub stack (chunk czQ9vYpC.js,
// pinned at .plannotator/our-stack/reference/, read 2026-11-17).

/** The luminous slab: a "rainbow light" spins around the stack and every face samples the soft
 *  five-stop palette by how its normal lines up with that light. Ours adds uShade, which darkens the
 *  floor of the BI engraved in the top face: a recess gets less light than the face around it. */
export const RAINBOW_VERTEX = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vLocalPos;
  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const RAINBOW_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uShade;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPos;

  // sky, teal, soft yellow, peach, warm red
  vec3 rainbow(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.40, 0.62, 0.94);
    vec3 c1 = vec3(0.50, 0.85, 0.78);
    vec3 c2 = vec3(0.97, 0.93, 0.55);
    vec3 c3 = vec3(0.99, 0.65, 0.36);
    vec3 c4 = vec3(0.97, 0.36, 0.42);
    float s = t * 4.0;
    if (s < 1.0) return mix(c0, c1, s);
    if (s < 2.0) return mix(c1, c2, s - 1.0);
    if (s < 3.0) return mix(c2, c3, s - 2.0);
    return mix(c3, c4, s - 3.0);
  }

  void main() {
    vec3 n = normalize(vWorldNormal);
    // 0.30 rad/s, breathing with two slow sines
    float lightAngle = uTime * 0.30 + sin(uTime * 1.3) * 0.10 + sin(uTime * 0.55 + 1.7) * 0.06;
    vec3 lightDir = normalize(vec3(cos(lightAngle), sin(lightAngle * 0.7) * 0.55, sin(lightAngle)));
    float align = dot(n, lightDir);
    // dominant colour from the normal, a small position wobble across each face
    float t = 0.5 + 0.5 * sin(align * 1.6 + uTime * 0.55)
            + 0.06 * sin(vLocalPos.x * 1.2 + vLocalPos.z * 1.1 + uTime * 0.7);
    vec3 col = rainbow(t);
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = clamp(lum + (col - lum) * 1.35, 0.0, 1.0);
    col = clamp(col * 1.10, 0.0, 1.0);

    col *= uShade;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Full-screen pass: the scene's render plus +-3% film grain where it has alpha. */
export const GRAIN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const GRAIN_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D uColor;
  varying vec2 vUv;
  void main() {
    vec4 orig = texture2D(uColor, vUv);
    float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    gl_FragColor = vec4(orig.rgb + (grain - 0.5) * 0.06 * orig.a, orig.a);
  }
`;
