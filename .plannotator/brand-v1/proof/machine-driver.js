const PAGES=["https://doop.design/a/Ax7cISPdot.jpg","https://doop.design/a/1HoAU0R8SQ.jpg","https://doop.design/a/ppvIUIaKGt.jpg","https://doop.design/a/0O3GYesWZz.jpg","https://doop.design/a/hyA9sn8Ppn.jpg"];
const W=1280,H=800,dpr=1.5,c=document.getElementById('c');c.width=W*dpr;c.height=H*dpr;
const g=c.getContext('2d');g.scale(dpr,dpr);g.imageSmoothingQuality='high';
const layer=document.createElement('canvas');layer.width=W*dpr;layer.height=H*dpr;const lg=layer.getContext('2d');lg.scale(dpr,dpr);lg.imageSmoothingQuality='high';
const imgs=PAGES.map(u=>{const i=new Image();i.src=u;return i});
const m=new BlankMachine(160,100,BLANK_RAMPS[document.body.dataset.ramp||'pyre']);
const T=6.4, ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
function progress(u){if(u<3)return ease(u/3);if(u<4.6)return 1;return 1-ease((u-4.6)/1.8)}
function draw(t){const cyc=Math.floor(t/T),u=t-cyc*T,p=progress(u);m.renderMachine(t*0.6,p,cyc);
 g.drawImage(m.canvas,0,0,W,H);const im=imgs[cyc%imgs.length];
 if(im.complete&&im.naturalWidth){lg.globalCompositeOperation='copy';lg.filter='grayscale(1) contrast(1.06)';lg.drawImage(im,0,0,W,H);lg.filter='none';
  lg.globalCompositeOperation='destination-in';lg.drawImage(m.mask,0,0,W,H);g.drawImage(layer,0,0,W,H);}}
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;const t0=performance.now()-2100;
function loop(){draw((performance.now()-t0)/1000);if(!still)requestAnimationFrame(loop)}
Promise.all(imgs.map(i=>i.decode().catch(()=>{}))).then(loop);
