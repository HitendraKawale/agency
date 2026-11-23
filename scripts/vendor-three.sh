#!/bin/sh
# Copies three.js out of node_modules into public/vendor, for the standalone three.js pages
# (public/f1/heatcar.html, public/services/room, public/people/wall). Their import maps point
# here instead of at unpkg, so the hero car no longer waits on a second origin.
# Re-run after bumping three, and update the version in those import maps.
set -e
cd "$(dirname "$0")/.."
V=$(node -p "require('./node_modules/three/package.json').version")
SRC=node_modules/three
OUT=public/vendor/three@$V
rm -rf "$OUT"
mkdir -p "$OUT/build"
cp "$SRC/build/three.module.min.js" "$OUT/build/"
# the addons those pages import, plus what those addons import
for f in loaders/GLTFLoader.js utils/BufferGeometryUtils.js libs/meshopt_decoder.module.js \
  geometries/RoundedBoxGeometry.js lights/RectAreaLightUniformsLib.js lights/RectAreaLightTexturesLib.js \
  postprocessing/EffectComposer.js postprocessing/MaskPass.js postprocessing/Pass.js \
  postprocessing/OutputPass.js postprocessing/RenderPass.js postprocessing/ShaderPass.js \
  postprocessing/UnrealBloomPass.js shaders/CopyShader.js shaders/LuminosityHighPassShader.js \
  shaders/OutputShader.js; do
  mkdir -p "$OUT/examples/jsm/$(dirname $f)"
  cp "$SRC/examples/jsm/$f" "$OUT/examples/jsm/$f"
done
echo "three $V -> $OUT"
