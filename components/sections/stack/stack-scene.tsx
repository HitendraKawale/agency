"use client";

// Our stack: rerun.io's Hub stack (slab, materials, lights, shuffle and grain copied from their
// source) with five layers instead of three. The four platforms drop in one by one, bottom to top,
// then the luminous slab, Blank, lands on top; Rerun keeps theirs at the bottom.
//
//   assembly   a GSAP tween that plays when the box scrolls into view (Lenis feeds ScrollTrigger).
//              Along it, slab i falls from DROP above, STEP after the one under it, turning a
//              quarter on the way down and landing on expo-out over LAND.
//   shuffle    Rerun's, once the stack is whole: every 5 s each slab turns 90 degrees about Y over
//              0.9 s, 50 ms after the one below. A square turned 90 degrees looks the same, so it
//              only reads while moving.
//   decals     each platform mark sits on its slab's top face but hangs off the group, not the
//              slab, so it follows the slab's height and stays upright while the slab turns under it.
//   engraving  BI is cut into the luminous slab's top face as geometry, so it belongs to the slab.
//              That slab sits out the shuffle, which would leave the mark sideways.
//
// three is imported on demand, so it stays out of the page's first load. GSAP's ticker renders
// only while the box is on screen; still mode renders the finished stack once.
import { useRef } from "react";
import { gsap, motionOn, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { BI_CONTOURS } from "@/lib/mark/bi-icon";
import { GRAIN_FRAGMENT, GRAIN_VERTEX, RAINBOW_FRAGMENT, RAINBOW_VERTEX } from "./stack.glsl";
import s from "./stack.module.css";

type Mark = { name: string; path: string };

const GAP = 0.78; // world units between slab centres
const DROP = 2.4, STEP = 0.38, LAND = 0.9; // assembly: drop height, then stagger and landing time (s)
const STILL_T = 2.6; // shader time for the still frame
/** px per world unit: Rerun draws theirs at ~42. The stack is 5.5 units wide and ~5.3 tall, so the
 *  box fits it with a margin; 54 at most, so a big box doesn't make big slabs. */
const ppu = (width: number, height: number) => Math.min(54, width / 9.5, height / 8.2);
const MARK_SIZE = 2.3; // world units across the engraved BI

const expoOut = (r: number) => (r >= 1 ? 1 : 1 - 2 ** (-10 * r));
/** Rerun's shuffle angle for slab `e` at `m` seconds into the loop. */
const shuffle = (m: number, e: number) => {
  const beat = Math.floor(m / 5), r = Math.max(0, Math.min(1, (m - beat * 5 - e * 0.05) / 0.9));
  return (beat + expoOut(r)) * (Math.PI / 2);
};

export function StackScene({ marks, label }: { marks: readonly Mark[]; label: string }) {
  const host = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const box = host.current!;
    const canvas = box.querySelector("canvas")!;
    let disposed = false;
    let cleanup = () => {};

    import("three").then(async (THREE) => {
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.AgXToneMapping; // threlte's default, which Rerun leaves on
      renderer.toneMappingExposure = 0.7;
      renderer.setClearColor(0, 0);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = env;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x7d8b99, 0.06));
      const key = new THREE.DirectionalLight(0xffffff, 0.4);
      key.position.set(6, 10, 5);
      const rim = new THREE.DirectionalLight(0x9ec1ff, 0.35);
      rim.position.set(-6, 4, -7);
      const fill = new THREE.DirectionalLight(0xffffff, 0.12);
      fill.position.set(2, 3, 8);
      scene.add(key, rim, fill);

      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
      camera.position.set(0, 3.4, 8.5);

      // Rerun's slab: a 3.9 rounded square with 0.37 corners, 0.25 deep, 0.05 bevel
      const bevel = 0.05, side = 4 - 2 * bevel, corner = 0.37, half = 3.9 / 2, inset = half - corner;
      const slabShape = () => {
        const shape = new THREE.Shape();
        shape.moveTo(-inset, -half);
        shape.lineTo(side / 2 - corner, -half);
        shape.quadraticCurveTo(side / 2, -half, side / 2, -inset);
        shape.lineTo(side / 2, side / 2 - corner);
        shape.quadraticCurveTo(side / 2, side / 2, side / 2 - corner, side / 2);
        shape.lineTo(-inset, side / 2);
        shape.quadraticCurveTo(-half, side / 2, -half, side / 2 - corner);
        shape.lineTo(-half, -inset);
        shape.quadraticCurveTo(-half, -half, -inset, -half);
        return shape;
      };
      const slabOpts = { depth: 0.25, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 16 };
      /** Extrude in the slab's frame: shape xy becomes the top face, depth runs from y = -0.175 up. */
      const extrude = (shapes: InstanceType<typeof THREE.Shape>[], opts: typeof slabOpts | { depth: number; bevelEnabled: false }) => {
        const g = new THREE.ExtrudeGeometry(shapes, opts);
        g.translate(0, 0, opts.bevelEnabled ? -0.125 : -0.175);
        g.rotateX(-Math.PI / 2);
        return g;
      };
      const slabGeo = extrude([slabShape()], slabOpts);

      // The engraving: BI cut ENGRAVE deep into the luminous slab's top face. The slab is extruded
      // with the letters as through-holes, so the bevel that rounds its outer edge also rounds the
      // engraving's lip; the B's counters stand back up as islands with the same bevel; and a plug
      // of the letters, ENGRAVE short of the top, is the floor. Everything is real geometry, so the
      // rainbow light colours the walls by their own normals as it turns.
      const ENGRAVE = 0.05; // the bevel's depth: the walls are the bevel, rounded from lip to floor
      const k = MARK_SIZE / Math.max(BI_CONTOURS.width, BI_CONTOURS.height);
      // SVG space to the top face: centred, y up, turned so the mark reads upright once the group's
      // 45 degree turn is applied
      const turn = (7 * Math.PI) / 4, cos = Math.cos(turn), sin = Math.sin(turn);
      const toFace = ([x, y]: readonly [number, number]) => {
        const u = (x - BI_CONTOURS.width / 2) * k, v = -(y - BI_CONTOURS.height / 2) * k;
        return new THREE.Vector2(u * cos - v * sin, u * sin + v * cos);
      };
      const contour = <T extends InstanceType<typeof THREE.Path>>(path: T, pts: readonly (readonly [number, number])[]) => {
        path.setFromPoints(pts.map(toFace));
        return path;
      };
      const cut = slabShape();
      cut.holes = BI_CONTOURS.letters.map((pts) => contour(new THREE.Path(), pts));
      const cutGeo = extrude([cut], slabOpts);
      const islandGeo = extrude(BI_CONTOURS.counters.map((pts) => contour(new THREE.Shape(), pts)), slabOpts);
      const letters = BI_CONTOURS.letters.map((pts, i) => {
        const shape = contour(new THREE.Shape(), pts);
        if (i === 0) shape.holes = BI_CONTOURS.counters.map((c) => contour(new THREE.Path(), c));
        return shape;
      });
      const floorGeo = extrude(letters, { depth: 0.35 - ENGRAVE, bevelEnabled: false });

      const white = new THREE.MeshPhysicalMaterial({
        color: 0xcecdca, roughness: 0.65, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.4, envMapIntensity: 0.4,
      });
      const uniforms = { uTime: { value: STILL_T }, uShade: { value: 1 } };
      const rainbow = new THREE.ShaderMaterial({ uniforms, vertexShader: RAINBOW_VERTEX, fragmentShader: RAINBOW_FRAGMENT });
      // the floor shares the clock and sits in the recess's shade
      const rainbowFloor = new THREE.ShaderMaterial({
        uniforms: { uTime: uniforms.uTime, uShade: { value: 0.55 } }, vertexShader: RAINBOW_VERTEX, fragmentShader: RAINBOW_FRAGMENT,
      });

      // a mark printed on a top face: an SVG path drawn into a texture on a plane
      const planes: InstanceType<typeof THREE.PlaneGeometry>[] = [], textures: InstanceType<typeof THREE.CanvasTexture>[] = [];
      const decal = (path: string, w: number, h: number, color: string, size: number) => {
        const c = document.createElement("canvas");
        c.width = c.height = 512;
        const g = c.getContext("2d")!, s = 512 / Math.max(w, h);
        g.translate((512 - w * s) / 2, (512 - h * s) / 2);
        g.scale(s, s);
        g.fillStyle = color;
        g.fill(new Path2D(path), "evenodd");
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        const plane = new THREE.PlaneGeometry(size, size);
        planes.push(plane);
        textures.push(tex);
        const m = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
        m.rotation.x = -Math.PI / 2;
        m.rotation.z = turn; // with the group's 45 degree turn, the mark's up is screen up
        return m;
      };

      const group = new THREE.Group();
      group.rotation.y = Math.PI / 4;
      scene.add(group);
      const blank = new THREE.Group();
      blank.add(new THREE.Mesh(cutGeo, rainbow), new THREE.Mesh(islandGeo, rainbow), new THREE.Mesh(floorGeo, rainbowFloor));
      const slabs: InstanceType<typeof THREE.Object3D>[] = [...marks.map(() => new THREE.Mesh(slabGeo, white)), blank];
      const decals = marks.map((m) => decal(m.path, 24, 24, "#a9a8a4", 1.15));
      group.add(...slabs, ...decals);
      const N = slabs.length;
      const finalY = (i: number) => (i - (N - 1) / 2) * GAP;

      // the grain pass, as Rerun: render to a multisampled target, then draw it with noise
      const target = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
      const quadGeo = new THREE.PlaneGeometry(2, 2);
      const grain = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: target.texture } }, transparent: true, depthTest: false, depthWrite: false,
        vertexShader: GRAIN_VERTEX, fragmentShader: GRAIN_FRAGMENT,
      });
      const quad = new THREE.Mesh(quadGeo, grain);
      quad.frustumCulled = false;
      const post = new THREE.Scene();
      post.add(quad);
      const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const size = () => {
        const r = box.getBoundingClientRect(), aspect = r.width / Math.max(1, r.height);
        renderer.setSize(r.width, r.height, false);
        target.setSize(Math.round(r.width * renderer.getPixelRatio()), Math.round(r.height * renderer.getPixelRatio()));
        const halfH = r.height / 2 / ppu(r.width, r.height); // fixed scale, so the stack keeps its size as the box changes
        camera.left = -halfH * aspect;
        camera.right = halfH * aspect;
        camera.top = halfH;
        camera.bottom = -halfH;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
      };

      const assembled = STEP * (N - 1) + LAND;
      /** Pose and draw the stack `a` units into the assembly, `sh` seconds into the shuffle;
       *  `time` drives the rainbow. */
      const draw = (a: number, sh: number, time: number) => {
        uniforms.uTime.value = time;
        slabs.forEach((slab, i) => {
          const p = Math.max(0, Math.min(1, (a - i * STEP) / LAND)), k = expoOut(p);
          const y = finalY(i) + DROP * (1 - k);
          slab.visible = p > 0;
          slab.position.y = y;
          const d = decals[i]; // none on the luminous slab: its mark is engraved
          if (d) {
            d.visible = p > 0;
            d.position.y = y + 0.176; // the top face plus its bevel
          }
          const whole = a >= assembled;
          slab.rotation.y = whole ? (i === N - 1 ? 0 : shuffle(sh, i)) : (-Math.PI / 2) * (1 - k);
        });
        renderer.setRenderTarget(target);
        renderer.setClearColor(0, 0);
        renderer.clear();
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(post, postCam);
      };

      // created after the async import, so outside useGSAP's context: cleanup kills them itself
      const triggers: ScrollTrigger[] = [];
      // a: assembly position, tweened by GSAP. sh: shuffle clock, running only while whole.
      const state = { a: 0 };
      let sh = 0, t = STILL_T, tick = () => {};
      const ro = new ResizeObserver(() => {
        size();
        draw(state.a, sh, t);
      });
      ro.observe(box);
      size();

      if (!motionOn()) {
        state.a = assembled;
        draw(state.a, sh, t);
      } else {
        draw(state.a, sh, t);
        let last = gsap.ticker.time;
        tick = () => {
          const now = gsap.ticker.time, dt = Math.min(0.1, now - last);
          last = now;
          t += dt;
          sh = state.a >= assembled ? sh + dt : 0;
          draw(state.a, sh, t);
        };
        // the assembly is a GSAP tween over `a`: it plays when the box comes into view, and resets
        // once the box drops back below the fold, so coming down again plays it again
        const assemble = gsap.to(state, {
          a: assembled,
          duration: assembled,
          ease: "none",
          scrollTrigger: { trigger: box, start: "top 75%", toggleActions: "play none none reset" },
        });
        triggers.push(
          assemble.scrollTrigger!,
          // render only while the box is on screen
          ScrollTrigger.create({
            trigger: box,
            start: "top bottom",
            end: "bottom top",
            onToggle: ({ isActive }) => {
              last = gsap.ticker.time;
              if (isActive) gsap.ticker.add(tick);
              else gsap.ticker.remove(tick);
            },
          }),
        );
      }

      cleanup = () => {
        ro.disconnect();
        triggers.forEach((st) => st.kill());
        gsap.ticker.remove(tick);
        slabGeo.dispose();
        white.dispose();
        rainbow.dispose();
        planes.forEach((p) => p.dispose());
        textures.forEach((x) => x.dispose());
        [cutGeo, islandGeo, floorGeo].forEach((g) => g.dispose());
        rainbowFloor.dispose();
        decals.forEach((d) => (d.material as InstanceType<typeof THREE.MeshBasicMaterial>).dispose());
        target.dispose();
        quadGeo.dispose();
        grain.dispose();
        env.dispose();
        pmrem.dispose();
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={host} className={s.box} role="img" aria-label={label}>
      <canvas aria-hidden />
    </div>
  );
}
