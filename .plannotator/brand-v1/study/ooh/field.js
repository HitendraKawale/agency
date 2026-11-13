// Heat fields for the study pages (OOH screen, spreads). One generator, four states, all through
// Rerun's cyclic spectrum (the ramp in mark/heatmark3.html), so every block reads as one system.
//   comb    rows of heat pushed in from the right, teeth thinning to the left (Rerun 12, frame 1)
//   scallop rows of rounded bumps rising through the field (Rerun 12, frames 4 to 9)
//   sweep   a broad warped gradient crossing sideways (Rerun 12, frames 10 and 11)
//   rise    the BI mark's wave: one band rising through the field with a warm mass in it
// makeField(canvas) returns draw(t, state, prevState, wipe): wipe is the fraction of the field
// height (from the top) already showing `state`; below it `prevState` still shows. A hard edge,
// as in Rerun's screen, where each new field drops in from the top.
const FIELD_STATES = { comb: 0, scallop: 1, sweep: 2, rise: 3 };

function makeField(canvas, dpr = 2) {
  const r = canvas.getBoundingClientRect();
  const W = (canvas.width = Math.round(r.width * dpr)), H = (canvas.height = Math.round(r.height * dpr));
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, antialias: false });
  const VS = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; uv.y = 1. - uv.y; gl_Position = vec4(p, 0., 1.); }`;
  const FS = `precision highp float; varying vec2 uv; uniform float t, st, pst, wipe, seed; uniform vec2 res;
vec3 ramp(float u){
  u = fract(u) * 5.;
  vec3 s0 = vec3(24.,106.,221.)/255., s1 = vec3(155.,191.,211.)/255., s2 = vec3(134.,217.,166.)/255.,
       s3 = vec3(246.,218.,117.)/255., s4 = vec3(215.,47.,33.)/255.;
  if (u < 1.) return mix(s0, s1, u); if (u < 2.) return mix(s1, s2, u - 1.);
  if (u < 3.) return mix(s2, s3, u - 2.); if (u < 4.) return mix(s3, s4, u - 3.); return mix(s4, s0, u - 4.);
}
float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 3; i++){ s += a * vn(p); p = p * 2.03 + 7.1; a *= .5; } return s; }
float field(float s, vec2 q){
  float asp = res.x / res.y; vec2 p = vec2(q.x * asp, q.y);
  vec2 w = vec2(fbm(p * 1.4 + seed + t * .05), fbm(p * 1.4 + seed + 3.1 - t * .04)) - .5;
  if (s < .5) {
    // comb: heat comes in from the right edge in rows; each row's tooth length breathes
    float rows = 16.;
    float row = sin(6.2832 * (q.y * rows + .15 * sin(t * .7)));
    float reach = .55 + .25 * sin(t * .9 + q.y * 3.);
    float tooth = smoothstep(reach - .5, reach + .25, q.x + .18 * row);
    return .08 + .1 * t + .55 * tooth + .1 * q.x + .03 * w.x;
  }
  if (s < 1.5) {
    // scallop: rows of rounded bumps, a band climbing through them
    float cols = 4.5;
    float bump = .5 + .5 * cos(6.2832 * q.x * cols);
    float sc = sin(6.2832 * (q.y * 4. - t * .25) - 2.4 * bump);
    return .12 * t + .9 * q.y + .12 * sc + .05 * w.y;
  }
  if (s < 2.5) {
    // sweep: a broad warped gradient moving sideways
    return .25 + .06 * t + .7 * (q.x + .12 * w.y + .06 * sin(q.y * 3. + t * .3));
  }
  // rise: the mark's wave, one cycle every five seconds, a warm mass low in the field
  vec2 d = vec2((q.x - .62) * asp * .5, q.y - .75);
  float m = exp(-dot(d, d) / .25);
  return .2 * t + .48 * (1. - q.y) + .2 * m + .1 * w.x;
}
void main(){
  float s = uv.y < wipe ? st : pst;
  vec3 c = ramp(field(s, uv));
  c += (h21(uv * res + fract(t * 7.)) - .5) * .035;
  gl_FragColor = vec4(c, 1.);
}`;
  const prog = gl.createProgram();
  for (const [ty, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]]) {
    const sh = gl.createShader(ty); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  gl.uniform2f(U("res"), W, H);
  return (t, state, prevState = state, wipe = 1, seed = 0) => {
    gl.viewport(0, 0, W, H);
    gl.uniform1f(U("t"), t); gl.uniform1f(U("st"), FIELD_STATES[state]); gl.uniform1f(U("pst"), FIELD_STATES[prevState]);
    gl.uniform1f(U("wipe"), wipe); gl.uniform1f(U("seed"), seed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
}
