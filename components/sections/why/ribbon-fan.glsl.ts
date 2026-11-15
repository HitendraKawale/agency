// The gain bar as a ribbon fan, after rerun.io's brand film: seven ribbons packed into the bar at its
// start, cold (mint, blue), opening out to the right like a reverse funnel and heating through yellow
// and orange to red, with warm edges and pulses running along them. Heat colours from heat-logo.ts.
// Canvas px, y down. uCy/uBundle place the bar's own band inside the overhanging canvas; at the right
// end the bundle has opened to uSpread and lifted by uLift. uGrow draws it in from the left.

export const VERTEX = `#version 300 es
in vec2 p; void main() { gl_Position = vec4(p, 0., 1.); }`;

export const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uT, uGrow, uCy, uBundle, uSpread, uLift, uDpr;
out vec4 o;
const vec3 MINT = vec3(.525,.851,.651), BLUE = vec3(.094,.416,.867), YELLOW = vec3(.965,.855,.459),
           ORANGE = vec3(.93,.45,.22), RED = vec3(.843,.184,.129);
// cold to hot, the heat-logo bands in their order: mint, blue, yellow, orange, red
vec3 heat(float t) {
  t = clamp(t, 0., 1.);
  if (t < .3) return mix(MINT, BLUE, smoothstep(0., .3, t));
  if (t < .5) return mix(BLUE, YELLOW, smoothstep(.3, .5, t));
  if (t < .66) return mix(YELLOW, ORANGE, smoothstep(.5, .66, t));
  return mix(ORANGE, RED, smoothstep(.66, .85, t));
}
float h11(float n) { return fract(sin(n * 91.3458) * 47453.5453); }
void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  float W = uRes.x / uDpr, x = px.x / W;
  float s = smoothstep(.2, 1.02, x);                       // flat bundle first, then the fan opens
  float cy = uCy - uLift * s, hw = mix(uBundle, uSpread, s);
  const int N = 7;
  vec3 col = vec3(0.); float A = 0.;
  for (int i = 0; i < N; i++) {
    float fi = float(i), of = (fi + .5) / float(N) * 2. - 1.;   // -1 top .. 1 bottom
    float k = 1. + .22 * sin(fi * 1.7 + .4);                   // each ribbon opens at its own rate
    float y = cy + of * mix(uBundle, uSpread * k, s) * (1. - 1. / float(N));
    float w = hw / float(N) * mix(1., 1.15 + .55 * h11(fi + 3.), s);   // they overlap as they open
    float d = (px.y - y) / w;
    float soft = min(.95, mix(.9, 16., s * s) / w);                       // edges soften toward the far end
    float a = 1. - smoothstep(1. - soft, 1., abs(d));
    if (a <= 0.) continue;
    // hotter to the right, and the upper ribbons hottest (the gain); pulses run along each ribbon
    float rank = .5 - .5 * of;
    float pulse = pow(.5 + .5 * sin(x * 11. - uT * 1.5 + fi * .55), 3.);
    float t = .06 + .1 * h11(fi) + s * (.42 + .58 * rank) + .14 * pulse * s
              + .06 * sin(uT * .55 + fi * .55);
    t -= .28 * pow(abs(d), 4.) * s;                            // edges cool a band: warm rims on red
    vec3 c = heat(t) * (1. - .18 * d * d);                     // rerun's lightness dome
    c = mix(c, vec3(1.), .18 * pulse * s * s);
    col = mix(col, c, a); A = A + a * (1. - A);
  }
  A *= 1. - smoothstep(uGrow - .015, uGrow, x);
  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - .5) * .08;
  o = vec4(col, A);
}`;
