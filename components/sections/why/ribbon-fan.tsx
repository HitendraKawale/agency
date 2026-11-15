"use client";

// Renders the ribbon-fan shader (ribbon-fan.glsl.ts) on a canvas that overhangs the bar.
// GSAP drives it: the ticker advances time while the bar is on screen, and a tween grows it in from
// the left once, the first time it scrolls into view. Still mode draws one finished frame.
import { useRef } from "react";
import { gsap, motionOn, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { FRAGMENT, VERTEX } from "./ribbon-fan.glsl";

/** spread and lift of the open end, px; the narrow values apply below 600px of bar width */
const FAN = { wide: { spread: 122, lift: 22 }, narrow: { spread: 76, lift: 12 } } as const;

export function RibbonFan({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useGSAP(() => {
    const cv = canvas.current!, bar = host.current!;
    const gl = cv.getContext("webgl2", { premultipliedAlpha: false, antialias: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
      return sh;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);

    const state = { grow: 0, t: 0 };
    const draw = () => {
      gl.uniform1f(U("uT"), state.t);
      gl.uniform1f(U("uGrow"), state.grow * 1.02);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const size = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      const fan = r.width < 600 ? FAN.narrow : FAN.wide;
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      const band = bar.offsetHeight, top = -cv.offsetTop; // the bar's band inside the canvas
      gl.uniform2f(U("uRes"), cv.width, cv.height);
      gl.uniform1f(U("uDpr"), dpr);
      gl.uniform1f(U("uCy"), top + band / 2);
      gl.uniform1f(U("uBundle"), band / 2);
      gl.uniform1f(U("uSpread"), fan.spread);
      gl.uniform1f(U("uLift"), fan.lift);
      draw();
    };
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    size();

    if (!motionOn()) {
      state.grow = 1;
      state.t = 2.6;
      draw();
      return () => ro.disconnect();
    }

    const t0 = gsap.ticker.time;
    const tick = () => {
      state.t = gsap.ticker.time - t0;
      draw();
    };
    ScrollTrigger.create({
      trigger: bar,
      start: "top bottom",
      end: "bottom top",
      onToggle: ({ isActive }) => (isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
      onEnter: () => gsap.to(state, { grow: 1, duration: 1.8, delay: 0.3, ease: "power3.out", overwrite: true }),
      once: false,
    });
    return () => {
      ro.disconnect();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <div ref={host} className={className}>
      <canvas ref={canvas} aria-hidden />
    </div>
  );
}
