'use client';

import { Heatmap } from '@paper-design/shaders-react';
import type { PaperShaderElement } from '@paper-design/shaders';
import { useEffect, useRef } from 'react';

const SIZE = 32;
const FPS = 10;

/**
 * Drives the browser-tab favicon from a live Heatmap shader: the shader renders
 * to a hidden canvas, and each tick is downscaled to 32x32 and swapped onto the
 * <link rel="icon"> as a PNG data URL.
 */
export function FaviconHeatmap() {
	const ref = useRef<PaperShaderElement>(null);

	useEffect(() => {
		let link =
			document.querySelector<HTMLLinkElement>('link[rel~="icon"]') ??
			document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon' }));
		const originalHref = link.href;

		const out = document.createElement('canvas');
		out.width = out.height = SIZE;
		const ctx = out.getContext('2d');
		if (!ctx) return;

		// Chrome only repaints the tab when the <link> element itself is replaced —
		// mutating href in place updates the DOM but leaves the old icon on screen.
		const swap = (href: string) => {
			const next = document.createElement('link');
			next.rel = 'icon';
			next.type = 'image/png';
			next.href = href;
			link.replaceWith(next);
			link = next;
		};

		const id = setInterval(() => {
			const source = ref.current?.paperShaderMount?.canvasElement;
			if (!source?.width) return;
			ctx.clearRect(0, 0, SIZE, SIZE);
			ctx.drawImage(source, 0, 0, SIZE, SIZE);
			swap(out.toDataURL('image/png'));
		}, 1000 / FPS);

		return () => {
			clearInterval(id);
			swap(originalHref);
		};
	}, []);

	return (
		<Heatmap
			ref={ref}
			// ponytail: kept in the viewport but invisible — the shader pauses itself
			// via IntersectionObserver, so it can't be parked off-screen.
			style={{ position: 'fixed', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
			aria-hidden
			width={SIZE}
			height={SIZE}
			webGlContextAttributes={{ preserveDrawingBuffer: true }}
			image="/mark.webp"
			colors={['#112069', '#1f3ca3', '#3265e7', '#6bd8ff', '#ffe77a', '#ff9a1f', '#ff4d00', '#9933cc', '#cc3399', '#cc3333']}
			colorBack="#000000"
			contour={0.5}
			angle={0}
			noise={0}
			innerGlow={0.5}
			outerGlow={0}
			speed={1}
			scale={1}
		/>
	);
}
