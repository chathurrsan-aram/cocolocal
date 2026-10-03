"""Fit Poppins size + tracking for each text block of the Canva pages by pixel overlap (IoU) with the original."""
import json, base64, pathlib, asyncio
from playwright.async_api import async_playwright
F = pathlib.Path('/root/offers-revision/part2/outputs/coco-offers-part2-cream/assets'); A = pathlib.Path('/root/hotfood/assets')
fonts = ''.join('@font-face{font-family:Poppins;src:url(data:font/woff2;base64,' + base64.b64encode((F / f'poppins-latin-{w}-normal.woff2').read_bytes()).decode() + ') format("woff2");font-weight:' + str(w) + ';}' for w in (500, 600, 700))
def du(p): return 'data:image/png;base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()
# page, key, text, weight, bbox (x0,y0,x1,y1) of ink on the original, size range
items = [
 ('p1','label','HOT FOOD',600,(866,73,981,93),(16,26)),
 ('p1','eyebrow','SOMETHING NEW AT YOUR LOCAL',600,(64,162,502,182),(16,26)),
 ('p1','h1a','Hot food.',700,(63,218,458,296),(80,110)),
 ('p1','h1b','Coming soon.',700,(61,315,684,420),(80,110)),
 ('p1','swipe','Swipe for a first look →',600,(644,448,932,476),(18,30)),
 ('p2','name','Sausage roll',700,(61,220,462,292),(54,72)),
 ('p2','price','£[0.00]',700,(62,310,460,440),(120,190)),
 ('p2','unit','Price to confirm · [each / portion]',600,(63,444,505,479),(20,32)),
 ('p6','h6a','Something hot',700,(65,221,702,321),(80,110)),
 ('p6','body','Follow along for the first look',500,(65,764,603,807),(28,44)),
 ('p6','handle','@cocolocal_',500,(65,1006,328,1047),(32,48)),
 ('p6','web','cocolocal.co.uk',500,(63,1082,374,1116),(32,48)),
 ('p1','addr','210 High Road, South Benfleet · SS7 5LD',600,(63,1252,473,1281),(16,26)),
 ('p1','disc','Coming soon · Product images are illustrative',500,(62,1289,450,1310),(13,22)),
]
JS = """async ([src, items]) => {
 const out={};const imgs={};
 for(const k in src){imgs[k]=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src[k]})}
 const cv=document.createElement('canvas');cv.width=1080;cv.height=1350;const c=cv.getContext('2d',{willReadFrequently:true});
 for(const [pg,key,txt,w,bb,rng] of items){
   c.clearRect(0,0,1080,1350);c.drawImage(imgs[pg],0,0);const [x0,y0,x1,y1]=bb;const bw=x1-x0+1,bh=y1-y0+1;
   const od=c.getImageData(x0,y0,bw,bh).data;const om=new Uint8Array(bw*bh);for(let i=0;i<bw*bh;i++){const l=(od[i*4]+od[i*4+1]+od[i*4+2])/3;om[i]=l<150?1:0}
   // tight ink bbox of the original inside the box
   let ox0=1e9,oy0=1e9,ox1=-1,oy1=-1;for(let y=0;y<bh;y++)for(let x=0;x<bw;x++)if(om[y*bw+x]){ox0=Math.min(ox0,x);oy0=Math.min(oy0,y);ox1=Math.max(ox1,x);oy1=Math.max(oy1,y)}
   let best={iou:-1};
   for(let sz=rng[0];sz<=rng[1];sz+=0.5)for(let tp=-8;tp<=24;tp+=0.5){const tr=tp*sz/100;
     c.clearRect(0,0,1080,1350);c.font=`${w} ${sz}px Poppins`;c.letterSpacing=tr+'px';c.fillStyle='#000';c.textAlign='left';c.fillText(txt,40,400);
     const m=c.measureText(txt);const iw=Math.round(m.actualBoundingBoxLeft+m.actualBoundingBoxRight),ih=Math.round(m.actualBoundingBoxAscent+m.actualBoundingBoxDescent);
     if(Math.abs(iw-(ox1-ox0+1))>8||Math.abs(ih-(oy1-oy0+1))>8)continue;
     const gx=Math.round(40-m.actualBoundingBoxLeft),gy=Math.round(400-m.actualBoundingBoxAscent);const d=c.getImageData(gx,gy,iw+2,ih+2).data;
     let inter=0,uni=0;const W2=iw+2;
     for(let y=0;y<=oy1-oy0;y++)for(let x=0;x<=ox1-ox0;x++){const a=om[(y+oy0)*bw+x+ox0];const bb2=(x<W2&&y<ih+2)?(d[(y*W2+x)*4+3]>128?1:0):0;if(a&&bb2)inter++;if(a||bb2)uni++}
     const iou=inter/uni;if(iou>best.iou)best={iou:+iou.toFixed(3),size:sz,trackPct:tp,track:+tr.toFixed(2),inkLeft:x0+ox0,inkTop:y0+oy0,ascent:+m.actualBoundingBoxAscent.toFixed(1),left:+m.actualBoundingBoxLeft.toFixed(1)}}
   best.baseline=+(best.inkTop+best.ascent).toFixed(1);best.x=+(best.inkLeft-best.left).toFixed(1);out[key]=best}
 return out}"""
async def main():
    src = {k: du(A / f'carousel-{k}.png') for k in ('p1', 'p2', 'p6')}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium'); pg = await b.new_page()
        await pg.set_content(f'<style>{fonts}</style><div style="font-family:Poppins">x</div>')
        await pg.evaluate("Promise.all([document.fonts.load('700 50px Poppins'),document.fonts.load('600 50px Poppins'),document.fonts.load('500 50px Poppins')])")
        r = await pg.evaluate(JS, [src, items]); await b.close()
    for k, v in r.items(): print(k, v)
    pathlib.Path('fit.json').write_text(json.dumps(r, indent=1))
asyncio.run(main())
