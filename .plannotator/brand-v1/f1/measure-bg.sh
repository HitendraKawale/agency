#!/bin/zsh
# Render 6 s at 4 fps into frames/<tag>/seq and print background hue series against the gear film.
tag=$1
cd /Users/blank/Desktop/CREATE/blank-agency/.plannotator/brand-v1/f1
mkdir -p frames/$tag/seq
agent-browser set viewport 960 540 >/dev/null 2>&1
for i in $(seq 0 23); do t=$(python3 -c "print($i/4)")
  agent-browser open "https://brand.blank-agency.localhost:1355/f1/heatcar?t=$t" >/dev/null
  agent-browser wait --fn "window.__ready === true" >/dev/null; agent-browser wait 400 >/dev/null
  agent-browser screenshot $PWD/frames/$tag/seq/f-$(printf %03d $i).png >/dev/null
done
cd /tmp && python3 -c "
from PIL import Image
import numpy as np, glob
def series(fs):
  A=np.stack([np.asarray(Image.open(f).convert('RGB').resize((480,270))).astype(float) for f in fs]); N=len(fs)
  pts={'TL':(.04,.06),'TR':(.96,.06),'ML':(.04,.5),'L2':(.12,.75),'BL':(.04,.94)}
  m=np.array([0x8c,0xae,0xd2],float); out={}
  for n,(x,y) in pts.items():
    c=A[:,int(y*270)-3:int(y*270)+3,int(x*480)-3:int(x*480)+3].reshape(N,-1,3).mean(1)
    d=c-m; u=d[:,0]-d[:,2]; v=d[:,1]-(d[:,0]+d[:,2])/2
    out[n]=(np.degrees(np.arctan2(v,u))%360, np.hypot(u,v))
  return out
ref=series(sorted(glob.glob('/Users/blank/Desktop/CREATE/blank-agency/reference/rerun/gear/seq8/*.png'))[::2])
mine=series(sorted(glob.glob('/Users/blank/Desktop/CREATE/blank-agency/.plannotator/brand-v1/f1/frames/$tag/seq/*.png')))
for n in ref:
  print(n,'ref ',' '.join('%3d'%x for x in ref[n][0]),' amp %.0f'%ref[n][1].mean())
  print(n,'mine',' '.join('%3d'%x for x in mine[n][0]),' amp %.0f'%mine[n][1].mean())
"
