#!/bin/zsh
# Render heatcar at times, then build a side-by-side sheet against gear film frames.
# usage: shoot.sh <tag> t1 t2 ...
tag=$1; shift
out=/Users/blank/Desktop/CREATE/blank-agency/.plannotator/brand-v1/f1/frames/$tag
ref=/Users/blank/Desktop/CREATE/blank-agency/reference/rerun/video/STUDIOGRUHL_RERUN_19-Artwork.mp4
mkdir -p $out
agent-browser set viewport 1600 900 >/dev/null 2>&1
for t in "$@"; do
  agent-browser open "https://brand.blank-agency.localhost:1355/f1/heatcar?t=$t" >/dev/null
  agent-browser wait --fn "window.__ready === true" >/dev/null
  agent-browser wait 1200 >/dev/null
  agent-browser screenshot $out/car-$t.png >/dev/null
  ffmpeg -v error -y -ss $t -i $ref -frames:v 1 -vf scale=1600:900 $out/ref-$t.png
  ffmpeg -v error -y -i $out/ref-$t.png -i $out/car-$t.png -filter_complex "[0]scale=800:450[a];[1]scale=800:450[b];[a][b]hstack" $out/pair-$t.png
done
args=(); for t in "$@"; do args+=(-i $out/pair-$t.png); done
n=$#
ffmpeg -v error -y $args -filter_complex "vstack=inputs=$n" $out/sheet.png
echo $out/sheet.png
