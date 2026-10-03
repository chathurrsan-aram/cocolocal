/* Coco Local hot food — shared motion helpers. Every frame is a pure function of time (seek). */
const NAVY='#101039', CREAM='#F7F3EA', MUTED='#585877', PILL='#FFDF78', RULE='#DFDBD2', AMBER='#F2A65A';
const cl=v=>Math.min(1,Math.max(0,v)), lerp=(a,b,t)=>a+(b-a)*t;
// closed-form damped spring, 0 -> 1
const S=(e,w=14,z=1)=>{if(e<=0)return 0;if(z<1){const wd=w*Math.sqrt(1-z*z),ex=Math.exp(-z*w*e);return 1-ex*(Math.cos(wd*e)+(z*w/wd)*Math.sin(wd*e));}const ex=Math.exp(-w*e);return 1-ex*(1+w*e);};
const SP={ui:[16,.86],soft:[9,1],snap:[22,.8],pop:[22,.62],slow:[5.5,1]};
const s=(t,sp=SP.ui)=>S(t,sp[0],sp[1]);
const easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
let x,W,H;
function setup(w,h){const c=document.getElementById('c');c.width=w;c.height=h;W=w;H=h;x=c.getContext('2d');}
function txt(str,px,py,size,weight=600,color=NAVY,align='left',max=1e4,track=0){x.font=`${weight} ${size}px Poppins`;x.letterSpacing=track+'px';let m=x.measureText(str).width;if(m>max){size*=max/m;x.font=`${weight} ${size}px Poppins`;}x.fillStyle=color;x.textAlign=align;x.fillText(str,px,py);x.letterSpacing='0px';return size}
function tw(str,size,weight=600,track=0){x.font=`${weight} ${size}px Poppins`;x.letterSpacing=track+'px';const m=x.measureText(str).width;x.letterSpacing='0px';return m}
function rr(a,b,w,h,r){x.beginPath();x.roundRect(a,b,w,h,r)}
function masked(x0,y0,w,h,fn){x.save();x.beginPath();x.rect(x0,y0,w,h);x.clip();fn();x.restore()}
function cover(im,dx,dy,dw,dh,zoom=1,fx=.5,fy=.5){const r=Math.max(dw/im.width,dh/im.height)*zoom,sw=dw/r,sh=dh/r;x.drawImage(im,(im.width-sw)*fx,(im.height-sh)*fy,sw,sh,dx,dy,dw,dh)}
// a headline line that rises word by word through a mask; returns nothing. words stagger by `gap` seconds
function wordsUp(line,px,py,size,t0,t,{weight=700,color=NAVY,gap=.07,track=-2,exitT=null,align='left',max=940,bounce=0}={}){
  x.font=`${weight} ${size}px Poppins`;x.letterSpacing=track+'px';{const full=x.measureText(line).width;if(full>max){size*=max/full;x.font=`${weight} ${size}px Poppins`;}}x.letterSpacing=track+'px';const words=line.split(' ');const sp=x.measureText(' ').width;
  let total=0;const ws=words.map(w=>{const m=x.measureText(w).width;total+=m;return m});total+=sp*(words.length-1);
  let cx=align==='center'?px-total/2:px;
  words.forEach((w,i)=>{const e=bounce?S(t-t0-i*gap,15,.55):s(t-t0-i*gap,SP.ui),o=exitT==null?0:s(t-exitT-i*gap*.6,SP.snap);
    if(e>0&&o<1){const ga=x.globalAlpha;const rot=bounce?(1-cl(e))*((i%2?1:-1)*.12)*bounce:0;
      masked(cx-30,py-size*1.15,ws[i]+60,size*1.45,()=>{x.globalAlpha=ga*cl(e*1.8)*(1-cl(o*1.6));x.fillStyle=color;x.textAlign='left';x.save();x.translate(cx+ws[i]/2,py+(1-e)*size*1.1-o*size*1.1);x.rotate(rot);x.fillText(w,-ws[i]/2,0);x.restore()});x.globalAlpha=ga}
    cx+=ws[i]+sp});
  x.letterSpacing='0px'}
// rises a single line as a block through its own mask
function lineUp(str,px,py,size,t0,t,{weight=600,color=NAVY,track=0,align='left',exitT=null,max=1e4}={}){const e=s(t-t0,SP.ui),o=exitT==null?0:s(t-exitT,SP.snap);if(e<=0||o>=1)return;
  const w=Math.min(tw(str,size,weight,track),max),x0=align==='center'?px-w/2:align==='right'?px-w:px;
  const ga=x.globalAlpha;masked(x0-20,py-size*1.15,w+40,size*1.5,()=>{x.save();x.globalAlpha=ga*cl(e*1.8)*(1-cl(o*1.6));txt(str,px,py+(1-e)*size*1.2-o*size*1.2,size,weight,color,align,max,track);x.restore()})}
function pill(label,px,py,size,a,{h=null,padX=null,w=null,align='left'}={}){if(a<=0)return;const hh=h||size*3,pw=w||tw(label,size,600,.5)+(padX||size*1.1)*2;
  const ga=x.globalAlpha;x.save();x.globalAlpha=ga*cl(a*1.6);const k=lerp(.7,1,cl(a))+.05*(a-cl(a));const ox=align==='center'?px:px+pw/2;x.translate(ox,py+hh/2);x.scale(k,k);
  rr(-pw/2,-hh/2,pw,hh,hh/2);x.fillStyle=PILL;x.fill();txt(label,-pw/2+(padX||size*1.1),size*.36,size,600,NAVY,'left',pw,.5);x.restore()}
// real steam: wisps rising from a base line, looping, gently swaying
function steam(img,cx,base,width,height,t,{n=4,alpha=.55,speed=.11,seed=0}={}){if(!img)return;const ga=x.globalAlpha;
  for(let i=0;i<n;i++){const ph=((t*speed+i/n+seed*.37)%1+1)%1,a=Math.sin(Math.PI*ph)**1.6*alpha;if(a<=.002)continue;
    const sc=lerp(.8,1.25,ph),w_=width*sc,h_=height*sc,flip=(i+seed)%2?-1:1;
    const sx=cx+Math.sin(t*.6+i*1.9+seed)*width*.08+(i-(n-1)/2)*width*.22;
    x.save();x.globalAlpha=ga*a;x.translate(sx,base-ph*height*.55);x.scale(flip,1);x.drawImage(img,-w_/2,-h_,w_,h_);x.restore()}}
function logo(img,px,py,h,a=1,reveal=1){if(a<=0||!img)return;const w=h*img.width/img.height;const ga=x.globalAlpha;x.save();x.globalAlpha=ga*a;if(reveal<1){x.beginPath();x.rect(px-4,py-4,(w+8)*reveal,h+8);x.clip()}x.drawImage(img,px,py,w,h);x.restore();return w}
function loadAll(srcs){const IMG={};return Promise.all([document.fonts.load('700 80px Poppins'),document.fonts.load('600 30px Poppins'),document.fonts.load('500 30px Poppins'),
  ...Object.entries(srcs).filter(([k,v])=>v).map(([k,v])=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>{IMG[k]=i;res()};i.onerror=()=>rej(k);i.src=v}))]).then(()=>IMG)}
function boot(frame,dur){window.seek=t=>frame(Math.max(0,Math.min(t,dur-1e-4)));window.DURATION=dur;seek(0);window.READY=true;
  if(!location.search.includes('render')){let st=null;const f=n=>{st??=n;seek(((n-st)/1000)%dur);requestAnimationFrame(f)};requestAnimationFrame(f)}}
