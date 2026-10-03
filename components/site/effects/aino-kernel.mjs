/**
 * Generated from pinned Aino declarations. Run scripts/extract-aino-effects.mjs.
 * The wrapper scopes settings, queries and scheduled work to this preview.
 * Function bodies match the source except I's CSS reader, which uses root.
 */
export function createAinoEffects(root, initialPreferences) {
  const timers = new Set();
  const frames = new Set();
  let disposed = false;
  const setTimeout = (callback, delay) => {
    const id = window.setTimeout(() => { timers.delete(id); if (!disposed) callback(); }, delay);
    timers.add(id);
    return id;
  };
  const clearTimeout = id => { window.clearTimeout(id); timers.delete(id); };
  const requestAnimationFrame = callback => {
    const id = window.requestAnimationFrame(time => { frames.delete(id); if (!disposed) callback(time); });
    frames.add(id);
    return id;
  };
  const cancelAnimationFrame = id => { window.cancelAnimationFrame(id); frames.delete(id); };
  const A = key => parseFloat(getComputedStyle(root).getPropertyValue('--' + key));
  const O = key => getComputedStyle(root).getPropertyValue('--' + key).split(',').map(Number);
  const M = (selector, container = root) => Array.from(container.querySelectorAll(selector));
  const subscribers = new Set();
  const C = {
    value: { ...initialPreferences, theme: 'blank' },
    subscribe(callback) { subscribers.add(callback); return () => subscribers.delete(callback); },
  };
  const E = { blank: [[5,9,10],[14,25,30],[187,201,199],[223,234,232]] };
  let D = E.blank.slice();
  const R = key => D.push(O(key));
  R('dark'); R('light');
  const restores = new Map();
function _(e,t,o){const n=document.createElement(e);if(t)for(const a in t)a in n?n[a]=t[a]:n.setAttribute(a,t[a]);return o&&o.appendChild(n),n}
function S(e,t){return getComputedStyle(e).getPropertyValue(t)}
function P(e,t,o){const n=Math.max(e,t,o);return 0===n?0:(n-Math.min(e,t,o))/n}
function $(e,t){const[o,n,a,s]=e,r=s/255,i=O(t?"dark":"light"),l=[o*r+i[0]*(1-r),n*r+i[1]*(1-r),a*r+i[2]*(1-r)];let c=null,d=1/0;for(const h of D){const[e,t,o]=h,n=(e-l[0])**2+(t-l[1])**2+(o-l[2])**2+50*(1-P(e,t,o));n<d&&(d=n,c=h)}return c}
var N=e=>!!(e.currentTime>0&&!e.paused&&!e.ended&&e.readyState>2);
function I(e,{factor:t=1,invertOnDarkMode:o=!1}={}){let n=0,a=0,s=!1;const r=[],i=_("canvas",{class:"pixelate"}),l=_("div",{class:"overlay"}),c=_("canvas");l.appendChild(c);const d=i.getContext("2d");function h(){const e=A("ch"),t=A("line"),o=S(root,"dark"===C.value.appearance?"--dark":"--light");c.width=i.width*e,c.height=i.height*t,c.style.width=i.width*e+"px",c.style.height=i.height*t+"px";const n=c.getContext("2d"),a=window.devicePixelRatio||1;c.width=c.offsetWidth*a,c.height=c.offsetHeight*a,n.scale(a,a);const s=c.offsetWidth,r=c.offsetHeight;n.clearRect(0,0,s,r);const l=e-2,d=t-2,h=Math.min(l,d)/3;n.fillStyle=`rgb(${o})`,n.fillRect(0,0,s,r),n.globalCompositeOperation="destination-out";for(let i=.5;i<r;i+=t)for(let t=.5;t<s;t+=e)n.beginPath(),n.roundRect(t,i,l,d,h),n.fill();n.globalCompositeOperation="source-over"}e.parentNode.appendChild(i),e.parentNode.appendChild(l);const u=()=>{if(!s)return;d.drawImage(e,0,0,i.width,i.height);const t=o&&"dark"===C.value.appearance;!function(e,t,o,n=!1){if(t&&o){const a=e.getImageData(0,0,t,o),{data:s}=a;for(let e=0;e<s.length;e+=4){let t=s[e],o=s[e+1],a=s[e+2];const r=s[e+3];n&&(t=255-t,o=255-o,a=255-a);const[i,l,c]=$([t,o,a,r],n);s[e]=i,s[e+1]=l,s[e+2]=c,s[e+3]=255}e.putImageData(a,0,0)}}(d,i.width,i.height,t)},f=()=>{const o=e.getBoundingClientRect();n=o.width,a=o.height;const s=A("ch"),r=A("line"),c=Math.round(n/s)*t,d=Math.round(a/r)*t;i.width=c,i.height=d,i.style.width=c*s+"px",i.style.height=d*r+"px",l.style.width=c*s+"px",l.style.height=d*r+"px"};let p=null,m=null,g=null;const v=()=>{if("requestVideoFrameCallback"in HTMLVideoElement.prototype){const t=()=>{u(),p=e.requestVideoFrameCallback(t)};p=e.requestVideoFrameCallback(t)}else{let t=0;const o=()=>{if(!e.paused&&!e.ended){const n=e.currentTime;Math.abs(n-t)>=.016&&(t=n,u()),m=requestAnimationFrame(o)}};m=requestAnimationFrame(o)}},y=()=>{s=!0,f(),u(),h(),"VIDEO"===e.tagName&&(N(e)?v():(g=()=>v(),e.addEventListener("play",g,{once:!0})))},x=new ResizeObserver(()=>{f(),u(),h()});switch(x.observe(e),e.tagName){case"IMG":e.complete?y():e.addEventListener("load",y,{once:!0});break;case"VIDEO":4===e.readyState||N(e)?y():e.addEventListener("loadeddata",y,{once:!0});break;default:throw new Error(`Unsupported source: ${e.tagName}`)}return r.push(C.subscribe((e,t)=>{e.theme!==t.theme&&(D=E[e.theme],R("dark"),R("light")),f(),u(),h()})),r.push(()=>{x.disconnect(),e.removeEventListener("load",y),e.removeEventListener("loadeddata",y),"VIDEO"===e.tagName&&(g&&e.removeEventListener("play",g),null!==p&&"cancelVideoFrameCallback"in HTMLVideoElement.prototype&&e.cancelVideoFrameCallback(p),null!==m&&cancelAnimationFrame(m)),i.remove(),l.remove()}),()=>{r.forEach(e=>e())}}
var H=e=>e<.5?2*e*e:(4-2*e)*e-1;
var q=e=>1+--e*e*e*e*e;
var z=(e,t,o)=>e*(1-o)+t*o;
var B=({r:e,g:t,b:o})=>.21*e+.72*t+.07*o;
var Y="NO0A869452I3?!<>=+/:-· ";
var K=e=>Y[Math.ceil(22*e/255)];
function J(e,t={}){const o=t.onReady,n=t.onFadeinStart,a=t.onFadeinComplete,s=t.forceShow,r=t.opacity,i=!!t.fadein;let l=t.filter||(e=>e),c=null,d=null;i&&(l=function({duration:e=1500,delay:t=50,sweep:o=0,onComplete:n,onStart:a}={}){const s=Date.now();let r=!1,i=!1;return l=>{const c=Date.now()-s-t;if(c<0)return l.replace(/[^\n]/g," ");i||(i=!0,a&&a());const d=e+o;if(Math.min(c/d,1)>=1)return r||(r=!0,n&&n()),l;let h=0;for(let e=0;e<l.length;e++)"\n"===l[e]&&h++;h||(h=1);let u=0,f="";for(let t=0;t<l.length;t++){const n=l[t];if("\n"===n){f+=n,u++;continue}if(" "===n){f+=n;continue}const a=c-(o?u/h*o:0),s=H(Math.max(0,Math.min(a/e,1))),r=Y.indexOf(n),i=Math.floor(z(23,r>=0?r:0,s));f+=i>=23?" ":"NO0A869452I3?!<>=+/:-· "[Math.max(0,Math.min(i,22))]||n}return f}}({...!0===t.fadein?{}:t.fadein,onStart:()=>{c&&(c.style.opacity=1),n&&n()},onComplete:()=>{null!==d&&(cancelAnimationFrame(d),d=null),a&&a()}}));let h=0,u=0,f=!1,p=!0,m=null;const g=_("canvas"),v=g.getContext("2d"),y=_("div",{class:"ascii"});c=y,s&&(y.style.display="block"),i&&(y.style.opacity=0),e.parentNode.appendChild(y);let x,W=0,w=0;const E=S(e,"object-fit"),b=()=>{if(!f||!e)return;const t=e.getBoundingClientRect();if(h=t.width,u=t.height,!h||!u)return;const n=A("ch"),a=A("line");if(g.width=Math.round(h/n),g.height=Math.round(u/a),e.src.endsWith(".svg")&&(v.fillStyle="#fff",v.fillRect(0,0,g.width,g.height)),void 0!==r&&(v.fillStyle="#fff",v.fillRect(0,0,g.width,g.height),v.globalAlpha="number"==typeof r?r:.5),"cover"===E){const[t,o]=S(e,"object-position").split(" "),n=Math.max(g.width/W,g.height/w*2),a=W*n,s=w*n/2;let r=0,i=0;r=(g.width-a)*(parseFloat(t)/100),i=(g.height-s)*(parseFloat(o)/100),v.drawImage(x||e,0,0,W,w,r,i,a,s)}else v.drawImage(e,0,0,g.width,g.height);v.globalAlpha=1;const s=v.getImageData(0,0,g.width,g.height);let i="";for(let e=0;e<s.data.length;e+=4){const[t,o,n]=s.data.slice(e,e+3),a=B({r:t,g:o,b:n}),r=(e/4+1)%g.width==0;i+=`${K(a)}${r?"\n":""}`}m=i,y.innerText=l(i),p&&o&&(p=!1,o(y))},C=new ResizeObserver(()=>b());C.observe(e);const M=()=>{const t="VIDEO"===e.tagName;if("cover"===E&&!t&&e.srcset){x=new Image;const t=e.srcset.split(", ")[1].split(" ")[0];x.onload=()=>{W=x.width,w=x.height,f=!0,b()},x.src=t}else W=t?e.videoWidth:e.naturalWidth||e.width,w=t?e.videoHeight:e.naturalHeight||e.height,f=!0,b()};let k=null,L=null,T=null;const D=()=>{if("requestVideoFrameCallback"in HTMLVideoElement.prototype){const t=()=>{b(),k=e.requestVideoFrameCallback(t)};k=e.requestVideoFrameCallback(t)}else{let t=0;const o=()=>{if(!e.paused&&!e.ended){const n=e.currentTime;Math.abs(n-t)>=.016&&(t=n,b()),L=requestAnimationFrame(o)}};L=requestAnimationFrame(o)}},O=()=>{N(e)?D():(T=()=>D(),e.addEventListener("play",T,{once:!0}))},R=()=>{const e=()=>{m&&(y.innerText=l(m)),d=requestAnimationFrame(e)};d=requestAnimationFrame(e)};switch(e.tagName){case"IMG":e.complete?(M(),i&&R()):e.addEventListener("load",()=>{M(),i&&R()},{once:!0});break;case"VIDEO":4===e.readyState||N(e)?(M(),O()):e.addEventListener("loadeddata",()=>{M(),O()},{once:!0});break;case"CANVAS":b();break;default:throw new Error(`Unsupported source: ${e.tagName}`)}return()=>{y.remove(),C.disconnect(),null!==d&&cancelAnimationFrame(d),"VIDEO"===e.tagName&&(e.removeEventListener("loadeddata",M),T&&e.removeEventListener("play",T),null!==k&&"cancelVideoFrameCallback"in HTMLVideoElement.prototype&&e.cancelVideoFrameCallback(k),null!==L&&cancelAnimationFrame(L))}}
var ue="$MBNQØW@&R8GD6S9ÖOH#ÉE5UK0ÄÅA2XP34ZC%VIF17YTJL[]?}{()<>|=+\\/^!\";*_:~,'-.·` ";
var We=ue.toLowerCase().replace(/[0-9@&#$%()[\]{}|\\/?!;*^]/g,"");
var we=new Map;
var Ee=new Map;
var be=new Map;
var Ce=!1;
function Me(){we.forEach((e,t)=>{const o=t.textContent.split("");let n=!1;for(const[a,{start:s,char:r,isLower:i,duration:l}]of Object.entries(e)){const t=0,c=Date.now();if(s>c)continue;const d=l*(1-t),h=H(Math.min((c-s)/d,1)),u=h,f=i?We:ue,p=f.indexOf(i?r:r.toUpperCase());if(-1===p){o[a]=r,delete e[a],n=!0;continue}const m=Math.floor(z(f.length,p,t));o[a]=f[Math.floor(z(m,p,u))],n=!0,1===h&&(o[a]=r,delete e[a])}if(n&&(t.textContent=o.join("")),0===Object.keys(e).length){we.delete(t);const e=be.get(t);e&&function(e){for(const[o,n]of be)if(n===e&&we.has(o))return;const t=Ee.get(e);if(t){Ee.delete(e);for(const[t,o]of be)o===e&&be.delete(t);t()}}(e)}}),we.size?requestAnimationFrame(Me):Ce=!1}
function ke(e,t,o,n){we.has(e)||we.set(e,{});const a=we.get(e);if(!(t in a)){const s=e.textContent.split("")[t],r=s===s.toLowerCase()&&s!==s.toUpperCase();a[t]={start:Date.now()+o,char:s,isLower:r,duration:n}}}
function _e(e){for(const[t,o]of be)o===e&&(we.delete(t),be.delete(t));Ee.delete(e)}
function Se(e,{filter:t,ready:o,speed:n=2,duration:a=400,random:s=!1}={}){e.style.opacity=0;let r=function(e){const t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT,null,!1),o=[];let n=t.nextNode();for(;n;)o.push(n),n=t.nextNode();return o}(e);t&&(r=r.filter(t)),o&&Ee.set(e,o);for(const l of r)be.set(l,e);let i=0;if(s)for(const l of r)if(l.textContent.trim())for(const e of l.textContent)e.trim()&&i++;(async()=>{let t=0;for(const e of r)if(e.textContent.trim()){const o=e.textContent.split("");for(let r=0;r<o.length;r++)o[r].trim()&&(ke(e,r,s?Math.random()*i*n:t,a),t+=n);e.textContent=o.map(()=>" ").join("")}Ce||(Ce=!0,Me()),setTimeout(()=>{e.style.opacity=1},50)})()}
var De;
var Re=()=>matchMedia("(hover: none)").matches;
var Pe=new Map;
var $e=new Map;
var Ne=[];
var Ie="$MBNQØW@&R8GD6S9ÖOH#ÉE5UK0ÄÅA2XP34ZC%VIF17YTJL*";
var Fe=Ie.toLowerCase().replace(/[0-9@&#$%()[\]{}|\\/?!;*^]/g,"");
function je(e,t,o,n){Pe.has(e)||(Pe.set(e,{}),function(e){const t=e.parentNode?.closest("button, a.button");t&&!t.classList.contains("fullwidth")&&($e.has(t)||(t.style.width=t.getBoundingClientRect().width+"px",$e.set(t,new Set)),$e.get(t).add(e))}(e));const a=Pe.get(e);if(!(t in a)){const s=e.textContent.split("")[t],r=s===s.toLowerCase()&&s!==s.toUpperCase();a[t]={distance:o,start:Date.now(),char:s,isLower:r,duration:n}}}
function He(){clearTimeout(De),Pe.forEach((e,t)=>{const o=t.textContent.split("");for(const[n,{char:a}]of Object.entries(e))o[n]=a;t.textContent=o.join("")}),Pe.clear();for(const e of $e.keys())e.style.width="";$e.clear();for(const{element:e,type:t,handler:o}of Ne)e.removeEventListener(t,o),delete e.dataset.active;Ne.length=0}
function Ue(){Pe.forEach((e,t)=>{const o=t.textContent.split("");let n=!1;for(const[a,{start:s,char:r,isLower:i,duration:l}]of Object.entries(e)){const t=0,c=Date.now(),d=l*(1-t),h=q(Math.min((c-s)/d,1)),u=1-2*Math.abs(h-.5),f=i?Fe:Ie,p=f.indexOf(i?r:r.toUpperCase()),m=p<f.length/2?f.length-1:0;o[a]=f[Math.floor(z(p,m,u))],n=!0,h>=.99&&(o[a]=r,delete e[a])}n&&(t.textContent=o.join("")),0===Object.keys(e).length&&(Pe.delete(t),function(e){for(const[t,o]of $e)o.delete(e),0===o.size&&(t.style.width="",$e.delete(t))}(t))}),De=setTimeout(Ue,25)}
function Ve(){clearTimeout(De),Ue();for(const e of M("a, button, .hoverchar")){if(e.dataset.active||e.closest(".text p"))continue;e.dataset.active="true";const t=e.dataset.dy||0,o=e.dataset.dx||1,n=e.dataset.duration||1e3,a=a=>{const s=A("ch"),{clientX:r,clientY:i}=a;for(let l=-t;l<=t;l++)for(let t=-o;t<=o;t++){const o=r+t*s,a=i+l*s*2;let c;if(document.caretPositionFromPoint){const e=document.caretPositionFromPoint(o,a);if(!e)return;c=document.createRange(),c.setStart(e.offsetNode,e.offset),c.setEnd(e.offsetNode,e.offset)}else document.caretRangeFromPoint&&(c=document.caretRangeFromPoint(o,a));if(!c)break;const d=c.getClientRects();if(!d.length)break;const h=[...d][0],u=c.startContainer,f=c.startOffset;if(o>h.left+s*f)break;if(u&&u.nodeType===Node.TEXT_NODE&&e.contains(u)&&!u.parentNode.closest(".big, .mega")){const e=(u.textContent||"").split("");if(f>=0&&f<e.length){const o=e[f];o.trim()&&(Ie.includes(o.toUpperCase())||Fe.includes(o))&&je(u,f,Math.abs(t*l),n)}u.textContent=e.join("")}}};if(Re()){const t=e=>a(e.touches[0]);e.addEventListener("touchmove",t),Ne.push({element:e,type:"touchmove",handler:t})}else e.addEventListener("mousemove",a),Ne.push({element:e,type:"mousemove",handler:a})}}
  return {
    ascii: J,
    pixel: I,
    scramble(element, options = {}) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const original = [];
      const previousOpacity = element.style.opacity;
      while (walker.nextNode()) original.push([walker.currentNode, walker.currentNode.textContent]);
      const restore = () => { _e(element); for (const [node, value] of original) node.textContent = value; element.style.opacity = previousOpacity; restores.delete(element); };
      restores.set(element, restore);
      Se(element, options);
      return restore;
    },
    hover() { Ve(); return He; },
    update(next) {
      const previous = C.value;
      C.value = { ...next, theme: 'blank' };
      for (const callback of subscribers) callback(C.value, previous);
    },
    dispose() {
      He();
      for (const restore of restores.values()) restore();
      disposed = true;
      for (const id of timers) window.clearTimeout(id);
      for (const id of frames) window.cancelAnimationFrame(id);
      timers.clear(); frames.clear(); subscribers.clear();
    },
  };
}
