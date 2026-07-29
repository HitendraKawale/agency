'use client';

import { Heatmap } from '@paper-design/shaders-react';

export default function HeatmapPage() {
	return (
		<main className="flex min-h-svh items-center justify-center bg-black">
			<Heatmap
				width={1280}
				height={720}
				image="https://shaders.paper.design/images/logos/diamond.svg"
				colors={['#112069', '#1f3ca3', '#3265e7', '#6bd8ff', '#ffe77a', '#ff9a1f', '#ff4d00', '#9933cc', '#cc3399', '#cc3333']}
				colorBack="#000000"
				contour={0.5}
				angle={0}
				noise={0}
				innerGlow={0.5}
				outerGlow={0.5}
				speed={1}
				scale={0.75}
			/>
		</main>
	);
}
