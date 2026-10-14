
const CC={};

/* binary (1 = ink) from RGBA */
CC.binarize=function(rgba,W,H,thr){thr=thr||150;const b=new Uint8Array(W*H);for(let i=0,p=0;i<W*H;i++,p+=4){const l=rgba[p]*0.299+rgba[p+1]*0.587+rgba[p+2]*0.114;b[i]=(rgba[p+3]>16&&l<thr)?1:0;}return b;};

/* the black/white cut. A clean print works at 150; a small or blurred picture draws its staff lines in light grey,
   so try stronger cuts and keep the lightest one that finds the most complete staves */
CC.autoThreshold=function(rgba,W,H){let best=150,bn=-1;
  [150,165,180,195,210,225,240].forEach(t=>{const n=CC.findSystems(CC.binarize(rgba,W,H,t),W,H).length;if(n>bn){bn=n;best=t;}});
  return best;};

/* staves: 5 evenly spaced long horizontal lines */
CC.findSystems=function(bin,W,H){
  const x0=Math.round(W*.1),x1=Math.round(W*.9),thr=0.45*(x1-x0),g=[];let cur=null;
  for(let y=0;y<H;y++){let c=0;const o=y*W;for(let x=x0;x<x1;x++)c+=bin[o+x];if(c>=thr){if(cur&&y-cur.e<=1)cur.e=y;else{cur={s:y,e:y};g.push(cur);}}}
  const ys=g.map(q=>(q.s+q.e)/2),out=[];let i=0;
  while(i+4<ys.length){const d=[ys[i+1]-ys[i],ys[i+2]-ys[i+1],ys[i+3]-ys[i+2],ys[i+4]-ys[i+3]],mn=Math.min(...d),mx=Math.max(...d),av=(d[0]+d[1]+d[2]+d[3])/4;
    if(mn>=3&&mx-mn<=Math.max(1.6,av*0.22)&&av<W*0.05){out.push({top:ys[i],bot:ys[i+4],sp:av,lines:ys.slice(i,i+5)});i+=5;}else i++;}
  return out;
};

/* row ink counts (3%..97% width) for lyric-bottom search */
CC.rowInk=function(bin,W,H){const r=new Int32Array(H),a=Math.round(W*.03),b=Math.round(W*.97);for(let y=0;y<H;y++){let c=0;const o=y*W;for(let x=a;x<b;x++)c+=bin[o+x];r[y]=c;}return r;};
CC.lyricBottoms=function(rows,H,sys,gapF){gapF=gapF||1;return sys.map((s,i)=>{const lim=i+1<sys.length?sys[i+1].top-2.6*sys[i+1].sp:H-1;let last=s.bot,gap=0,found=false;
  for(let y=Math.round(s.bot+1);y<=lim;y++){if(rows[y]>1){last=y;gap=0;}else{gap++;if(gap>=gapF*s.sp&&last>s.bot+2*s.sp){found=true;break;}}}
  const v=Math.max(s.bot+s.sp,Math.min(lim,last+0.45*s.sp));return found?v:{y:v,none:true,bot:s.bot,sp:s.sp};});};
CC.lyrY=v=>typeof v==='number'?v:v.y;

/* connected components inside a horizontal band */
function components(bin,W,ya,yb){
  const h=yb-ya,lab=new Int32Array(W*h),comps=[];let n=0;const st=[];
  for(let y=0;y<h;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!bin[(ya+y)*W+x]||lab[i])continue;n++;lab[i]=n;st.length=0;st.push(i);
    let x0=x,x1=x,y0=y,y1=y;const px=[];
    while(st.length){const j=st.pop();const jy=(j/W)|0,jx=j-jy*W;px.push(j);if(jx<x0)x0=jx;if(jx>x1)x1=jx;if(jy<y0)y0=jy;if(jy>y1)y1=jy;
      for(let dy=-1;dy<=1;dy++){const ny=jy+dy;if(ny<0||ny>=h)continue;for(let dx=-1;dx<=1;dx++){const nx=jx+dx;if(nx<0||nx>=W)continue;const k=ny*W+nx;if(!lab[k]&&bin[(ya+ny)*W+nx]){lab[k]=n;st.push(k);}}}}
    comps.push({x0,y0:y0+ya,x1:x1+1,y1:y1+1+ya,w:x1-x0+1,h:y1-y0+1,px,ya,W});}
  return comps;
}

/* chord tokens for every staff */
CC.chordTokens=function(bin,W,H,sys,lyrBottoms){
  const toks=[];
  sys.forEach((s,i)=>{const sp=s.sp,yb=Math.round(s.top-0.2*sp);let ya=Math.round(s.top-6*sp);
    if(i>0){const L=lyrBottoms?lyrBottoms[i-1]:sys[i-1].bot+3*sys[i-1].sp;const lb=typeof L==='number'?L:L.bot+1.2*L.sp;ya=Math.max(ya,Math.round(Math.min(lb,typeof L==='number'?s.top-4.5*sp:lb)+0.2*sp));}
    ya=Math.max(0,ya);if(yb-ya<sp)return;
    /* a 1st/2nd-ending bracket line can touch the chord names and glue them into one block: wipe thin long lines first */
    const band=bin.slice(ya*W,yb*W),bh=yb-ya,thin=Math.max(2,Math.round(0.3*sp));
    for(let y=0;y<bh;y++){let x=0;while(x<W){if(!band[y*W+x]){x++;continue;}let e=x;while(e+1<W&&band[y*W+e+1])e++;
        if(e-x+1>=3*sp){for(let xx=x;xx<=e;xx++){let a=y,b=y;while(a>0&&band[(a-1)*W+xx])a--;while(b<bh-1&&band[(b+1)*W+xx])b++;if(b-a+1<=thin)for(let yy=a;yy<=b;yy++)band[yy*W+xx]=0;}}
        x=e+1;}}
    let cs=components(band,W,0,bh).map(c=>{c.y0+=ya;c.y1+=ya;c.ya=ya;return c;}).filter(c=>{
      if(c.y1>=yb-1)return false;       // stems, heads, beams touching the staff side
      if(c.h<0.25*sp&&c.w<0.25*sp)return false;            // specks
      if(c.w>4*sp&&c.h<0.6*sp)return false;                 // volta / bracket lines
      if(c.w<0.22*sp&&c.h>1.8*sp)return false;              // bracket hooks
      if(c.h>4.8*sp)return false;
      return true;});
    cs.sort((a,b)=>a.x0-b.x0);
    const groups=[];
    cs.forEach(c=>{const g=groups[groups.length-1];
      if(g){const gap=c.x0-g.x1,hm=Math.max(c.h,g.hmax),vov=Math.min(c.y1,g.y1)-Math.max(c.y0,g.y0);
        if(gap<0.42*hm&&vov>-0.6*hm){g.comps.push(c);g.x0=Math.min(g.x0,c.x0);g.x1=Math.max(g.x1,c.x1);g.y0=Math.min(g.y0,c.y0);g.y1=Math.max(g.y1,c.y1);g.hmax=Math.max(g.hmax,c.h);return;}}
      groups.push({comps:[c],x0:c.x0,x1:c.x1,y0:c.y0,y1:c.y1,hmax:c.h});});
    groups.forEach(g=>{if(g.hmax<0.75*sp||g.x1-g.x0<0.35*sp)return;g.sys=i;g.sp=sp;toks.push(g);});
  });
  /* bar numbers sit at the far left of a line and are smaller than the chord names */
  const hs=toks.map(t=>t.hmax).sort((a,b)=>a-b),mh=hs.length?hs[hs.length>>1]:0;
  return toks.filter(t=>!(t.x1<0.07*W&&t.hmax<0.8*mh));
};


function maskOf(c){const m=new Uint8Array(c.w*c.h);c.px.forEach(j=>{const jy=(j/c.W)|0,jx=j-jy*c.W;m[(jy+c.ya-c.y0)*c.w+(jx-c.x0)]=1;});return m;}
function runsRow(m,w,y){let r=0,p=0;for(let x=0;x<w;x++){const v=m[y*w+x];if(v&&!p)r++;p=v;}return r;}
function runsCol(m,w,h,x){let r=0,p=0;for(let y=0;y<h;y++){const v=m[y*w+x];if(v&&!p)r++;p=v;}return r;}
function colCover(m,w,h,x){let n=0;for(let y=0;y<h;y++)if(m[y*w+x])n++;return n/h;}
function holesOf(m,w,h){/* enclosed white areas: count and vertical centre (0 top .. 1 bottom) */
  const lab=new Int32Array(w*h),out=[];let n=0;for(let i=0;i<w*h;i++){if(m[i]||lab[i])continue;n++;let border=false,sy=0,cnt=0;const st=[i];lab[i]=n;
    while(st.length){const j=st.pop(),y=(j/w)|0,x=j-y*w;cnt++;sy+=y;if(x===0||y===0||x===w-1||y===h-1)border=true;[[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>{const X=x+a,Y=y+b;if(X<0||Y<0||X>=w||Y>=h)return;const k=Y*w+X;if(!m[k]&&!lab[k]){lab[k]=n;st.push(k);}});}
    if(!border&&cnt>=2)out.push({cy:sy/cnt/h,cnt});}
  return out;}
CC.shape=function(c,hm){
  const m=maskOf(c),w=c.w,h=c.h,dens=c.px.length/(w*h);c.mask=m;
  if(h>=0.55*hm&&w/h>=0.22&&w/h<=0.85&&dens<0.42){
    const band=Math.max(1,Math.round(h*0.2));let tx=0,tn=0,bx=0,bn=0;
    for(let y=0;y<band;y++)for(let x=0;x<w;x++)if(m[y*w+x]){tx+=x;tn++;}
    for(let y=h-band;y<h;y++)for(let x=0;x<w;x++)if(m[y*w+x]){bx+=x;bn++;}
    if(tn&&bn&&tx/tn>w*0.6&&bx/bn<w*0.4)return 'slash';}
  if(h>=0.55*hm&&w/h<=0.8){
    let stem=0;const lw=Math.max(1,Math.round(w*0.32));for(let y=0;y<h;y++){let f=0;for(let x=0;x<lw;x++)if(m[y*w+x]){f=1;break;}stem+=f;}
    const r25=runsRow(m,w,Math.round(h*0.22)),r75=runsRow(m,w,Math.round(h*0.75));
    let topW=0;for(let y=0;y<Math.round(h*0.3);y++){let mx=-1;for(let x=w-1;x>=0;x--)if(m[y*w+x]){mx=x;break;}topW=Math.max(topW,mx+1);}
    if(stem/h>=0.88&&r25===1&&r75>=2&&topW<=w*0.5)return 'flat';}
  if(h>=0.6*hm&&w/h>=0.25&&w/h<=0.95&&dens<0.62){
    const cm=Math.round(w/2),band=(a,b)=>{let best=0;for(let xx=Math.floor(w*a);xx<=Math.ceil(w*b)&&xx<w;xx++){let run=0,mx=0;for(let y=0;y<h;y++){if(m[y*w+xx]){run++;mx=Math.max(mx,run);}else run=0;}best=Math.max(best,mx/h);}return best;}; /* one unbroken vertical stroke in each outer band */
    const ends=(fa,fb)=>{for(let y=Math.max(0,Math.round(h*fa));y<=Math.min(h-1,Math.round(h*fb));y++){let ink=0;for(let xx=0;xx<w;xx++)ink+=m[y*w+xx];if(runsRow(m,w,y)>=2&&ink<=0.6*w)return true;}return false;}; /* the two strokes stick out alone at top and bottom */
    const bars=[];for(let y=Math.round(h*0.2);y<=Math.round(h*0.8);y++){let ink=0;for(let xx=0;xx<w;xx++)ink+=m[y*w+xx];if(runsRow(m,w,y)===1&&ink>=0.75*w)bars.push(y);} /* two full-width bars in the middle, unlike D or B */
    if(bars.length>=2&&bars[bars.length-1]-bars[0]>=0.15*h&&ends(0.04,0.16)&&ends(0.84,0.96)&&runsRow(m,w,Math.round(h*0.5))>=2&&runsCol(m,w,h,cm)>=2&&band(0.1,0.42)>=0.65&&band(0.58,0.9)>=0.65&&(runsRow(m,w,Math.round(h*0.18))>=2||runsRow(m,w,Math.round(h*0.82))>=2)&&(hs=>(hs.length===0&&dens<0.55)||(hs.length===1&&hs[0].cy>=0.38&&hs[0].cy<=0.57))(holesOf(m,w,h)))return 'sharp';} /* its one box sits in the middle; b and a have their hole low */ /* a bold B has two holes */
  return '';
};

/* redraw a token: raised small glyphs (superscripts, raised numerators, °) are moved down to the
   baseline and enlarged, so OCR sees one line of evenly sized characters */
CC.tokenImage=function(tok,target){
  target=target||46;const all=tok.comps.slice().sort((a,b)=>a.x0-b.x0);all.forEach(c=>{c.kind=CC.shape(c,tok.hmax);});
  const letters=all.filter(c=>!c.kind),hm=letters.length?Math.max(...letters.map(c=>c.h)):tok.hmax,big=all.filter(c=>!c.kind&&c.h>=0.72*hm),base=big.length?Math.max(...big.map(c=>c.y1)):Math.max(...all.map(c=>c.y1));
  const s=target/hm,pad=16,place=[];let cursor=pad;
  /* accidentals that follow a tall letter are taken out and re-inserted as text after OCR */
  const acc={root:'',bass:'',list:[]};let seenSlash=false,lettersSeen=0;const cs=[];
  const tallAfter=k=>all.slice(k+1).some(c=>!c.kind&&c.h>=0.72*hm);
  all.forEach((c,k)=>{const prev=cs[cs.length-1];
    if(c.kind==='slash'){seenSlash=true;cs.push(c);return;}
    if((c.kind==='sharp'||c.kind==='flat')&&prev&&prev.h>=0.72*hm&&prev.kind!=='slash'&&prev.w>=0.45*prev.h){const v=c.kind==='sharp'?'#':'b'; /* not after a bracket: (b9) keeps its flat */
      /* lift it out after the root, after the bass (past a slash), or after the last letter when the slash was not seen */
      if(seenSlash||lettersSeen===1||!tallAfter(k)){acc.list.push({idx:lettersSeen,v,at:(prev.x1-tok.x0)/Math.max(1,tok.x1-tok.x0)});if(seenSlash||(lettersSeen>1&&!tallAfter(k)))acc.bass=v;else acc.root=v;return;}
      cs.push(c);return;}
    if(c.h>=0.72*hm)lettersSeen++;cs.push(c);});
  acc.tall=lettersSeen;acc.glued=all.length===1&&all[0].w>1.3*all[0].h; /* one blob holding the whole chord (thin fonts) */
  tok.acc=acc;tok.hmL=hm;tok.base=base;
  /* the first mark after the root letter, read by shape: three legs = m (minor), two legs and a V = M (major 7th);
     OCR often drops a small m or reads a small capital M as m */
  {const ri=cs.findIndex(c=>!c.kind&&c.h>=0.72*hm);
    /* a letter b written right after the root is the flat, not the quality */
    const isB=c=>{if(c.kind||c.h<0.85*hm||c.w/c.h>0.7)return false;const hs=holesOf(c.mask||maskOf(c),c.w,c.h);return hs.length===1&&hs[0].cy>0.5;};
    let qi=ri+1;if(ri>=0&&cs[qi]&&isB(cs[qi])){acc.rootB=true;qi++;}
    const q=ri>=0&&cs[qi]&&cs[qi].kind!=='slash'?cs[qi]:null;
    if(ri>=0){const R=cs[ri],m=R.mask||maskOf(R),w=R.w,h=R.h,rr=f=>runsRow(m,w,Math.min(h-1,Math.round(h*f)));acc.root2={r50:rr(0.5),r58:rr(0.58),r66:rr(0.66),ratio:w/h};}
    const q2=q&&cs[qi+1]&&cs[qi+1].kind!=='slash'?cs[qi+1]:null;
    if(q2){const m=q2.mask||maskOf(q2);acc.q2={ratio:q2.w/q2.h,rel:q2.h/hm,kind:q2.kind,holes:holesOf(m,q2.w,q2.h)};}
    if(q){const m=q.mask||maskOf(q),w=q.w,h=q.h,r=f=>runsRow(m,w,Math.min(h-1,Math.round(h*f)));
      acc.q={w,h,ratio:w/h,legs:r(0.85),mid:r(0.5),top:r(0.12),rel:h/hm,raised:q.y1<base-0.22*hm,holes:holesOf(m,w,h)};}}
  cs.forEach((c,k)=>{let sc=s,bottom=c.y1;
    const raised=c.y1<base-0.22*hm;
    if(raised){bottom=base;if(c.h<0.7*hm)sc=s*Math.min(1.7,0.78*hm/c.h);}
    const dw=Math.max(1,Math.round(c.w*sc)),dh=Math.max(1,Math.round(c.h*sc));
    const dx=k===0?pad:Math.max(cursor+2,Math.round(pad+(c.x0-tok.x0)*s));
    const dy=Math.round(pad+(bottom-tok.y0)*s)-dh;
    place.push({c,dx,dy,dw,dh});cursor=Math.max(cursor,dx+dw);});
  const minY=Math.min(...place.map(p=>p.dy)),shift=pad-minY;place.forEach(p=>p.dy+=shift);
  const OW=cursor+pad,OH=Math.max(...place.map(p=>p.dy+p.dh))+pad,out=new Uint8ClampedArray(OW*OH*4).fill(255);
  place.forEach(p=>{const c=p.c,mask=c.mask||maskOf(c);
    for(let y=0;y<p.dh;y++){const sy=Math.min(c.h-1,Math.floor(y*c.h/p.dh));for(let x=0;x<p.dw;x++){const sx=Math.min(c.w-1,Math.floor(x*c.w/p.dw));if(mask[sy*c.w+sx]){const o=((p.dy+y)*OW+(p.dx+x))*4;out[o]=out[o+1]=out[o+2]=0;}}}});
  return {data:out,width:OW,height:OH};
};

/* ---- chord grammar ---- */
const QUALS=['','m','7','m7','maj7','M7','6','m6','9','m9','add9','add2','(add2)','(add9)','2','sus4','sus2','sus','7sus4','dim','dim7','°','°7','aug','+','m7(b5)','m7b5','7(b9)','13(b9)','11','m11','13','maj9','M9','5','mM7','aug7','7(b5)','7(#9)','6/9','sus4(add9)','m(add9)','madd9','7sus'];
const CHEAP={'s6':.4,'6s':.4,'S6':.4,'b6':.5,'nm':.5,'mn':.5,'o°':.3,'°o':.3,'0°':.3,'s5':.5,'5s':.5,'i/':.5,'l/':.5,'1/':.5,'j/':.5,'I/':.5,'S5':.5,'z2':.5,'Z2':.5};
function lev(a,b){const m=a.length,n=b.length,d=[];for(let i=0;i<=m;i++){d[i]=[i];}for(let j=1;j<=n;j++)d[0][j]=j*0.8;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){const sub=a[i-1]===b[j-1]?0:(CHEAP[a[i-1]+b[j-1]]||1);d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+0.8,d[i-1][j-1]+sub);}return d[m][n];}
CC.parseChord=function(raw){
  let t=String(raw||'').replace(/\s+/g,'').replace(/♯/g,'#').replace(/♭/g,'b').replace(/[oO0](?=7?$)/,'°');
  /* other ways people write the same chord: Cmin7/C-7 → Cm7, Cø → Cm7b5, CΔ7/C^7 → Cmaj7, Cm(maj7) → CmM7, am7 → Am7 */
  t=t.replace(/^([a-g])(?=[#b]?(m|M|maj|min|mi|sus|add|dim|aug|[0-9]|\/|$|-|°|ø|Δ|△|\^|\())/,c=>c.toUpperCase());
  t=t.replace(/^([A-G][#b]?)(min|mi)(?![a-z])/,'$1m').replace(/^([A-G][#b]?)-/,'$1m').replace(/ø7?/,'m7b5').replace(/[Δ△^]/,'maj').replace(/m\(?maj7\)?/,'mM7');
  t=t.replace(/^[^A-G]+/,'');if(!t)return null;
  t=t.replace(/^([A-G])[gHi](?![a-z])/,'$1#').replace(/^([A-G])[gHi](?=m|\/|M|[0-9]|s|a|d)/,'$1#').replace(/^([A-G])[gH](?=n)/,'$1#'); /* 'Fin' stays Fine */
  t=t.replace(/([A-Za-z0-9#)°])[lI1|ij]([A-G][#bgH]?)$/,'$1/$2');
  t=t.replace(/\/([A-G])[gHij4]$/,'/$1#');
  t=t.replace(/[^A-Za-z0-9#/()+°]/g,'');
  t=t.replace(/(\/[A-G][#b]?)\d+$/,'$1');
  const opens=(t.match(/\(/g)||[]).length,closes=(t.match(/\)/g)||[]).length;
  if(opens!==closes)t=t.replace(/[()]/g,'');
  const m=t.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);if(!m)return null;
  let q=m[2],exact=QUALS.includes(q),dist=0;
  if(!exact){let best='',bd=99;QUALS.forEach(c=>{const d=lev(q,c);if(d<bd){bd=d;best=c;}});const lim=q.length<=2?1:Math.ceil(q.length*0.4);if(bd<=lim){dist=bd;}else return {text:t,root:m[1],qual:m[2],bass:m[3]||'',ok:false,raw};}
  return {text:m[1]+q+(m[3]?'/'+m[3]:''),root:m[1],qual:q,bass:m[3]||'',ok:exact,dist,raw};
};

/* apply re-inserted accidentals, then parse; if the text holds two or three chords, split it */
CC.readToken=function(text,acc){
  let raw=String(text||'').trim(),fine=false;
  /* a C read as a bracket: "(/Bb" is C/Bb */
  raw=raw.replace(/^[(\[{](?=\/|m|7|maj|sus|add)/,'C');
  /* the word Fine written right after a chord: keep the chord, report the word */
  {const f=raw.match(/^(.*[A-G].*?)\s*F[il1|!I]?n[eE3]?$/);if(f&&CC.parseChord(f[1])&&CC.parseChord(f[1]).ok){raw=f[1];fine=true;}}
  /* the first tall mark must look like a letter; a slur or tie read as a chord is much wider than tall */
  if(acc&&acc.root2&&acc.root2.ratio>1.8)return [];
  /* "/F": only the bass changes, the chord before it stays */
  {const b=raw.match(/^[\/|]\s*([A-G])(#|b)?$/);if(b){const bass=b[1]+(b[2]||(acc&&acc.list.length?acc.list[acc.list.length-1].v:''));return [{root:null,bassOnly:true,bass,text:'/'+bass,frac:0,fracEnd:1,ok:true}];}}
  if(acc&&acc.glued&&raw.indexOf('/')<0)raw=raw.replace(/^([A-G][#b]?)([A-G])/,'$1/$2');
  /* put each sharp/flat back after the letter it followed */
  if(acc&&acc.list&&acc.list.length){const L=[];for(let i=0;i<raw.length;i++)if(/[A-G]/.test(raw[i]))L.push(i);
    const pick=a=>{if(L.length===acc.tall)return L[a.idx-1];let best=null,bd=9;L.forEach(i=>{const d=Math.abs((i+1)/raw.length-a.at);if(d<bd){bd=d;best=i;}});return best;};
    const ins=acc.list.map(a=>({i:pick(a),v:a.v})).filter(z=>z.i!==null&&z.i!==undefined).sort((a,b)=>b.i-a.i);const done=new Set();
    ins.forEach(z=>{if(done.has(z.i))return;done.add(z.i);if(/[#b]/.test(raw[z.i+1]||''))return;raw=raw.slice(0,z.i+1)+z.v+raw.slice(z.i+1);});}
  /* a gap left where a sharp/flat was lifted out can come back as a space: "F m7", "G7 /B" belong together */
  const chunks=[];raw.split(/\s+/).filter(Boolean).forEach(c=>{if(chunks.length&&!/^[A-G]/.test(c)&&/^[\/(#bmM0-9a-z°+]/.test(c))chunks[chunks.length-1]+=c;else{const v=c.replace(/^[^A-G]+/,'');if(v)chunks.push(v);}});
  if(!chunks.length)return [];
  const out=[];let pos=0;const total=chunks.join('').length;
  chunks.forEach(t=>{const parts=splitChords(t);parts.forEach(p=>{p.frac=(pos+p.at)/Math.max(1,total);p.fracEnd=(pos+p.at+p.len)/Math.max(1,total);out.push(p);});pos+=t.length;});
  if(out.length===1&&out[0].root&&acc)shapeFix(out[0],acc);
  if(fine)out.fine=true;
  return out;
};
/* OCR slips that the glyph shapes can settle (only for a token holding one chord) */
function shapeFix(p,acc){let root=p.root,qual=p.qual,changed=false;const q=acc.q,q2=acc.q2,r2=acc.root2;
  const setQ=v=>{if(QUALS.includes(v)){qual=v;changed=true;}};
  /* C and G: G has a bar just below the middle */
  if(r2&&root[0]==='G'&&r2.r58===1){root='C'+root.slice(1);changed=true;}
  else if(r2&&root[0]==='C'&&r2.r58>=2&&r2.r66>=2){root='G'+root.slice(1);changed=true;}
  if(q){const isM=q.top===2&&((q.legs===2&&q.ratio<1)||(q.mid>=4&&q.rel>=0.85&&q.legs<=3)),ism=q.legs===3&&q.mid===3&&q.ratio>=1&&q.rel<0.85;
    if(isM&&/^m(?!aj)/.test(qual)&&/^m(7|9|11|13)/.test(qual))setQ('maj'+qual.slice(1));
    else if(ism&&!/^m/.test(qual)&&!/^(M|aug|\+|dim|°|sus)/.test(qual))setQ('m'+qual);
    /* a raised 9 (hole at the top, narrow) is not the diminished circle */
    if(qual==='°'&&q.holes.length===1&&q.holes[0].cy<0.45&&q.ratio<0.8)setQ('9');
    /* a 6 that OCR dropped or read as o: one hole in the lower half */
    const six=g=>g&&g.kind!=='slash'&&g.rel<=0.9&&g.holes.length===1&&g.holes[0].cy>0.58&&g.ratio>=0.45&&g.ratio<0.9; /* a flat sign is taller and thinner */
    if(qual==='m'&&six(q2))setQ('m6');else if(qual===''&&six(q))setQ('6');}
  if(changed){p.root=root;p.qual=qual;p.text=root+qual+(p.bass?'/'+p.bass:'');p.ok=true;p.fixed=true;}}
function splitChords(t){
  const one=CC.parseChord(t);if(one&&one.ok){one.at=0;one.len=t.length;return [one];}
  const cuts=[0];for(let i=1;i<t.length;i++)if(/[A-G]/.test(t[i])&&t[i-1]!=='/')cuts.push(i);cuts.push(t.length);
  const n=cuts.length,best=new Array(n).fill(null);best[0]={k:0,list:[]};
  for(let a=0;a<n-1;a++){if(!best[a])continue;for(let b=a+1;b<n;b++){const seg=t.slice(cuts[a],cuts[b]),p=CC.parseChord(seg);if(!p||!(p.ok||(p.dist!==undefined&&p.dist<=0.6)))continue;p.at=cuts[a];p.len=seg.length;const cand={k:best[a].k+1+(p.ok?0:p.dist),list:best[a].list.concat([p])};if(!best[b]||cand.k<best[b].k)best[b]=cand;}} /* a near match (one look-alike letter) may join a split */
  if(best[n-1])return best[n-1].list;
  if(one){one.at=0;one.len=t.length;return [one];}return [];
}

/* ---- transposition ---- */
const LET={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const SP={flat:['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'],sharp:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],c:['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B']};
CC.spellFor=k=>[5,10,3,8,1].includes(k)?SP.flat:(k===0?SP.c:SP.sharp);
CC.pc=n=>((LET[n[0]]+(n[1]==='#'?1:n[1]==='b'?-1:0))%12+12)%12;
/* move a chord to another key keeping its letters in step with the key: in F→G, D/F# becomes E/G#, and
   in the same key nothing changes. Spellings like E#, B#, Cb, Fb or double sharps/flats fall back to the plain name. */
const KEYLET=['C','D','D','E','E','F','F','G','A','A','B','B'],LETS='CDEFGAB',NATPC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
CC.transpose=function(ch,shift,toKey,fromKey){shift=((shift%12)+12)%12;if(shift===0)return ch.root+ch.qual+(ch.bass?'/'+ch.bass:'');if(fromKey===undefined)fromKey=((toKey-shift)%12+12)%12;
  const sp=CC.spellFor(toKey),steps=((LETS.indexOf(KEYLET[toKey])-LETS.indexOf(KEYLET[fromKey]))%7+7)%7;
  const r=x=>CC.transposeNote(x,shift,toKey,fromKey,sp,steps);
  return r(ch.root)+ch.qual+(ch.bass?'/'+r(ch.bass):'');};
CC.transposeNote=function(x,shift,toKey,fromKey,sp,steps){shift=((shift%12)+12)%12;if(fromKey===undefined)fromKey=((toKey-shift)%12+12)%12;
  sp=sp||CC.spellFor(toKey);if(steps===undefined)steps=((LETS.indexOf(KEYLET[toKey])-LETS.indexOf(KEYLET[fromKey]))%7+7)%7;
  const t=((CC.pc(x)+shift)%12+12)%12,kn=CC.keyNames(toKey);if(kn[t])return kn[t];
  const L=LETS[(LETS.indexOf(x[0])+steps)%7],acc=((t-NATPC[L])%12+18)%12-6;
  const name=acc===0?L:acc===1?L+'#':acc===-1?L+'b':null;if(!name||/^(E#|B#|Cb|Fb)$/.test(name))return sp[t];return name;};
/* the seven note names of a major key, by pitch class */
CC.keyNames=function(k){k=((k%12)+12)%12;const SHN=[0,0,2,0,4,0,6,1,0,3,0,5],FLN=[0,5,0,3,0,1,0,0,4,0,2,0],SO=[5,0,7,2,9,4,11],FO=[11,4,9,2,7,0,5];
  const up=new Set(SO.slice(0,SHN[k])),dn=new Set(FO.slice(0,FLN[k])),out={};'CDEFGAB'.split('').forEach(L=>{const pc=NATPC[L],a=up.has(pc)?1:dn.has(pc)?-1:0;const nm=L+(a>0?'#':a<0?'b':'');out[((pc+a)%12+12)%12]={'E#':'F','B#':'C','Cb':'B','Fb':'E'}[nm]||nm;});return out;};

/* ---- chord tones for playback ---- */
CC.tones=function(ch){
  const q=ch.qual;let iv;
  if(q==='5')iv=[0,7];
  else if(/sus2/.test(q))iv=[0,2,7];else if(/sus/.test(q))iv=[0,5,7];
  else if(/dim|°/.test(q))iv=[0,3,6];else if(/aug|\+/.test(q))iv=[0,4,8];
  else if(/^m(?!aj)/.test(q))iv=[0,3,7];else iv=[0,4,7];
  if(/b5/.test(q))iv=iv.map(x=>x===7?6:x);                       /* 7(b5) keeps its major third, m7b5 its minor one */
  if(/maj7|M7|maj9|M9/.test(q))iv.push(11);
  else if(/dim7|°7/.test(q))iv.push(9);
  else if(/(^|[^0-9/])(7|9|11|13)/.test(q)&&!/add|6\/9/.test(q))iv.push(10);
  if(/6/.test(q)&&!/b5|13/.test(q))iv.push(9);
  if(/b9/.test(q))iv.push(13);else if(/#9/.test(q))iv.push(15);
  else if(/9|add2|^2$|11|13/.test(q))iv.push(14);
  if(/11/.test(q)){iv.push(17);if(!/^m/.test(q))iv=iv.filter(x=>x!==4);}   /* an 11 chord drops the major third */
  if(/13/.test(q))iv.push(21);
  return {root:CC.pc(ch.root),bass:ch.bass?CC.pc(ch.bass):CC.pc(ch.root),iv};
};


/* barlines: thin columns covering the whole staff and empty just outside it */
CC.barlines=function(bin,W,s){
  const t=Math.round(s.top),b=Math.round(s.bot),h=b-t+1,sp=s.sp,Hh=bin.length/W,lines=(s.lines||[]).map(Math.round),xs=[];
  const isLineRow=y=>lines.some(l=>Math.abs(l-y)<=2);
  for(let x=0;x<W;x++){let n=0;for(let y=t;y<=b;y++)n+=bin[y*W+x];if(n<h-2)continue;
    let up=0;for(let y=t-1;y>=0&&bin[y*W+x];y--)up++;let dn=0;for(let y=b+1;y<Hh&&bin[y*W+x];y++)dn++;
    if(up>0.6*sp||dn>0.6*sp)continue;xs.push(x);}
  const g=[];xs.forEach(x=>{const l=g[g.length-1];if(l&&x-l.e<=2)l.e=x;else g.push({s:x,e:x});});
  /* a stem has a notehead at one end: lots of ink next to it near the top or bottom line */
  const headNear=(x)=>{const r=Math.round(0.95*sp);let best=0;[[t+Math.round(0.15*sp),t+Math.round(0.85*sp)],[b-Math.round(0.85*sp),b-Math.round(0.15*sp)]].forEach(([ya,yb])=>{[-1,1].forEach(side=>{let n=0;
      for(let y=ya;y<=yb;y++){if(y<0||y>=Hh||isLineRow(y))continue;for(let k=2;k<=r;k++){const xx=Math.round(x)+side*k;if(xx>=0&&xx<W&&bin[y*W+xx])n++;}}best=Math.max(best,n);});});return best>0.3*sp*sp;};
  let bars=g.filter(q=>q.e-q.s<=0.6*sp).map(q=>(q.s+q.e)/2).filter(x=>!headNear(x));
  const merged=[];bars.forEach(x=>{const l=merged[merged.length-1];if(l!==undefined&&x-l<1.5*sp)merged[merged.length-1]=x;else merged.push(x);});
  const y=Math.round(s.top);let x0=0,x1=W-1;while(x0<W&&!bin[y*W+x0])x0++;while(x1>0&&!bin[y*W+x1])x1--;
  return {x0,x1,bars:merged};
};


/* a segno / coda sign inside a chord-row token: a roughly square glyph with three or more holes */
CC.signIn=function(tok){
  for(const c of tok.comps){if(c.h<1.0*tok.sp||c.w<0.8*tok.sp)continue;const r=c.w/c.h;if(r<0.6||r>1.6)continue;
    const m=c.mask||maskOf(c),w=c.w,h=c.h,seen=new Uint8Array(w*h),st=[];
    for(let x=0;x<w;x++){st.push(x,(h-1)*w+x);}for(let y=0;y<h;y++){st.push(y*w,y*w+w-1);}
    while(st.length){const j=st.pop();if(seen[j]||m[j])continue;seen[j]=1;const y=(j/w)|0,x=j-y*w;if(x>0)st.push(j-1);if(x<w-1)st.push(j+1);if(y>0)st.push(j-w);if(y<h-1)st.push(j+w);}
    let holes=0;for(let j=0;j<w*h;j++){if(seen[j]||m[j])continue;let a=0;const q=[j];while(q.length){const k=q.pop();if(seen[k]||m[k])continue;seen[k]=1;a++;const y=(k/w)|0,x=k-y*w;if(x>0)q.push(k-1);if(x<w-1)q.push(k+1);if(y>0)q.push(k-w);if(y<h-1)q.push(k+w);}if(a>=0.02*tok.sp*tok.sp)holes++;}
    if(holes>=3)return c.x0;}
  return null;};

/* small text right before a barline under the staff (where "Fine" or "D.S. al Fine" often sits) */
CC.belowTokens=function(bin,W,H,sys,barsPer){
  const out=[];
  sys.forEach((s,i)=>{const sp=s.sp,ya=Math.round(s.bot+0.5*sp),yb=Math.min(H,Math.round(s.bot+5*sp));if(i+1<sys.length&&yb>sys[i+1].top-3*sp)return;if(yb-ya<sp)return;
    const bl=barsPer[i]||{bars:[],x1:W};const ends=bl.bars.concat([bl.x1]);
    const cs=components(bin,W,ya,yb).filter(c=>c.h>=0.3*sp&&c.h<=1.6*sp&&c.w<=3*sp&&ends.some(e=>c.x1<=e+0.5*sp&&c.x1>=e-12*sp));
    cs.sort((a,b)=>a.x0-b.x0);const groups=[];
    cs.forEach(c=>{const g=groups[groups.length-1];if(g&&c.x0-g.x1<0.9*sp&&Math.abs((c.y0+c.y1)/2-(g.y0+g.y1)/2)<0.8*sp){g.x1=Math.max(g.x1,c.x1);g.y0=Math.min(g.y0,c.y0);g.y1=Math.max(g.y1,c.y1);g.x0=Math.min(g.x0,c.x0);return;}groups.push({x0:c.x0,x1:c.x1,y0:c.y0,y1:c.y1});});
    const ph=CC.phrases(groups.filter(g=>g.y1-g.y0<=1.6*sp).map(g=>({sys:i,x0:g.x0,x1:g.x1,y0:g.y0,y1:g.y1,sp})));
    ph.forEach(p=>{if(ends.some(e=>p.x1<=e+0.5*sp&&p.x1>=e-4*sp))out.push(Object.assign(p,{where:'below'}));});});
  return out;
};
/* join word tokens on one line into a phrase box */
CC.phrases=function(toks){const s=toks.slice().sort((a,b)=>a.sys-b.sys||a.x0-b.x0),out=[];
  s.forEach(t=>{const p=out[out.length-1];if(p&&p.sys===t.sys&&t.x0-p.x1<2.2*t.sp&&Math.abs((t.y0+t.y1)/2-(p.y0+p.y1)/2)<0.9*t.sp){p.x1=Math.max(p.x1,t.x1);p.y0=Math.min(p.y0,t.y0);p.y1=Math.max(p.y1,t.y1);p.n++;return;}
    out.push({sys:t.sys,x0:t.x0,x1:t.x1,y0:t.y0,y1:t.y1,sp:t.sp,n:1});});return out;};
/* what a phrase says */
CC.markType=function(text,phrase){const t=String(text||'').replace(/\s+/g,' ').trim();
  /* capital D.S. / D.C. on their own (not the end of a word like "Chords"), Fine as a whole word */
  if(/(^|[^A-Za-z])D\.?\s?S\.?(?![A-Za-z])/.test(t)||/dal\s*segno/i.test(t))return 'ds';
  if(/(^|[^A-Za-z])D\.?\s?C\.?(?![A-Za-z])/.test(t)||/da\s*capo/i.test(t))return 'dc';
  if(/(^|[^A-Za-z])fin[ec](?![A-Za-z])/i.test(t)&&!/(^|[^A-Za-z])al(?![A-Za-z])/i.test(t))return 'fine';
  if(phrase&&phrase.n===1&&/^[S$%§8OQ0@]$/.test(t)&&(phrase.y1-phrase.y0)>=1.1*phrase.sp&&phrase.where!=='below')return 'segno';
  return null;};

/* guess the major key from the chords */
CC.guessKey=function(chs){
  if(!chs.length)return null;const sc=[0,2,4,5,7,9,11],minorDeg=[2,4,9];let best=0,bs=-1e9;
  for(let k=0;k<12;k++){let v=0;chs.forEach((c,i)=>{const r=((CC.pc(c.root)-k)%12+12)%12;if(sc.includes(r)){v+=1;if(r===0)v+=1;if(r===5||r===7)v+=0.5;const m=/^m(?!aj)/.test(c.qual);if(m===minorDeg.includes(r))v+=0.3;}else v-=0.6;});
    const last=chs[chs.length-1];if(((CC.pc(last.root)-k)%12+12)%12===0)v+=2;if(((CC.pc(chs[0].root)-k)%12+12)%12===0)v+=1;
    if(v>bs){bs=v;best=k;}}
  return best;
};


/* ---- rewriting chords in a new key from the sheet's own print ----
   Only the letters (and their sharps/flats) change with the key; m7, sus4, 6, maj7 and the slash stay as printed.
   So a chord in the new key is put together from: a letter glyph taken from elsewhere on the same sheet,
   an accidental glyph from the sheet, and the quality marks copied pixel for pixel from the chord itself. */
CC.maskOf=maskOf;

/* the glyphs of one token grouped per chord */

/* a slash printed touching the letter next to it comes out as one blob ("/D", "m/B"): find the diagonal and cut it out */
CC.splitSlash=function(c){const m=c.mask||maskOf(c),w=c.w,h=c.h;if(h<6||w<1.15*h)return null;
  const t=Math.max(1,Math.round(0.07*h));let best=null;
  for(let xb=0;xb<w;xb++)for(let k=Math.round(0.3*h);k<=Math.round(1.0*h);k++){const xt=xb+k;if(xt>=w+t)break;let hit=0,side=0;
    for(let y=0;y<h;y++){const xx=Math.round(xb+k*(1-y/(h-1)));let on=false;for(let dx=-1;dx<=1;dx++){const X=xx+dx;if(X>=0&&X<w&&m[y*w+X])on=true;}if(on)hit++;
      const a=xx-t-2,b=xx+t+2;if((a>=0&&m[y*w+a])||(b<w&&m[y*w+b]))side++;}
    const cov=hit/h,sc=cov-0.6*side/h;if(cov>=0.9&&(!best||sc>best.sc))best={xb,k,sc,cov,side:side/h};}
  if(!best||best.side>0.45)return null;
  const lineX=y=>best.xb+best.k*(1-y/(h-1));const parts=[[],[],[]];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(!m[y*w+x])continue;const d=x-lineX(y);parts[d<-t-0.5?0:d>t+0.5?2:1].push([x,y]);}
  const mk=(pts,kind)=>{if(pts.length<3)return null;let x0=w,x1=-1,y0=h,y1=-1;pts.forEach(([x,y])=>{if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;});const W2=x1-x0+1,H2=y1-y0+1,mm=new Uint8Array(W2*H2);pts.forEach(([x,y])=>{mm[(y-y0)*W2+(x-x0)]=1;});
    return {x0:c.x0+x0,x1:c.x0+x1+1,y0:c.y0+y0,y1:c.y0+y1+1,w:W2,h:H2,mask:mm,px:[],dens:pts.length/(W2*H2),kind,synthetic:true};};
  const L=mk(parts[0],''),S=mk(parts[1],'slash'),R=mk(parts[2],'');if(!S||(!L&&!R))return null;
  /* a real slash is thin: its own box is not much wider than the stroke */
  if(S.dens<0.12)return null;
  return [L,S,R].filter(Boolean);};
function densOf(c){return c.dens!==undefined?c.dens:c.px.length/(c.w*c.h);}
CC.glyphParts=function(tok,letters,nSplit){
  const hm=tok.hmL||tok.hmax;let all=[],left=nSplit||0;tok.comps.slice().sort((a,b)=>a.x0-b.x0).forEach(c=>{const sp=(left>0&&!c.kind&&c.h>=0.72*hm)?CC.splitSlash(c):null;if(sp){left--;all.push.apply(all,sp);}else all.push(c);});
  const tall=c=>!c.kind&&c.h>=0.72*hm&&c.w<=1.15*c.h;
  const isB=c=>{if(c.kind||c.h<0.85*hm||c.w/c.h>0.7)return false;const hs=holesOf(c.mask||maskOf(c),c.w,c.h);return hs.length===1&&hs[0].cy>0.5;};
  /* letters: the roles the OCR text expects, in order ('root' or 'bass'); used when the count of tall glyphs matches */
  let roles=null;if(letters&&letters.length){const talls=[];all.forEach((c,i)=>{if(!tall(c))return;const prev=all[i-1];if(prev&&tall(prev)&&c.x0-prev.x1<0.35*hm&&isB(c))return;talls.push(c);});if(talls.length===letters.length)roles=letters.slice();}
  const parts=[];let cur=null,last=null;
  all.forEach((c,i)=>{const prev=all[i-1];
    if(c.kind==='slash'){if(cur&&!cur.slash&&!cur.bass){cur.slash=c;last=null;}else if(cur)cur.after.push(c);return;}
    if((c.kind==='sharp'||c.kind==='flat')&&last&&!last.part[last.which+'Acc']&&c.x0-last.comp.x1<0.6*hm){last.part[last.which+'Acc']=c;last.part[last.which+'AccV']=c.kind==='sharp'?'#':'b';return;}
    if(tall(c)){
      if(last&&!last.part[last.which+'Acc']&&c.x0-last.comp.x1<0.35*hm&&isB(c)){last.part[last.which+'Acc']=c;last.part[last.which+'AccV']='b';return;}
      let role;if(roles)role=roles.shift()||'qual';else role=(cur&&cur.slash&&!cur.bass)?'bass':((!prev||prev.kind==='slash'||c.x0-prev.x1>=0.3*hm)?'root':'qual');
      if(role==='bass'&&cur&&!cur.bass){cur.bass=c;last={comp:c,part:cur,which:'bass'};return;}
      if(role==='root'||(role==='bass'&&!cur)){cur={root:c,qual:[],slash:null,bass:null,after:[]};parts.push(cur);last={comp:c,part:cur,which:'root'};return;}}
    if(!cur)return;
    last=null;if(cur.bass)cur.after.push(c);else cur.qual.push(c);});
  parts.forEach(p=>{const cs=[p.root,p.rootAcc].concat(p.qual,[p.slash,p.bass,p.bassAcc],p.after).filter(Boolean);
    p.x0=Math.min.apply(null,cs.map(c=>c.x0));p.x1=Math.max.apply(null,cs.map(c=>c.x1));p.y0=Math.min.apply(null,cs.map(c=>c.y0));p.y1=Math.max.apply(null,cs.map(c=>c.y1));p.hm=hm;});
  return parts;};
/* pair the glyph groups with the chords read from the text; null when they do not line up */
CC.glyphsFor=function(tok,parts){const rootParts=parts.filter(p=>p.root);if(!rootParts.length)return null;
  const letters=[];rootParts.forEach(p=>{letters.push('root');if(p.bass)letters.push('bass');});
  const wantSlash=rootParts.filter(p=>p.bass).length,haveSlash=tok.comps.filter(c=>c.kind==='slash').length;
  let gps=CC.glyphParts(tok,letters,Math.max(0,wantSlash-haveSlash));
  if(parts.fine&&gps.length===rootParts.length+1)gps=gps.slice(0,-1);   /* the word Fine after the chord */
  if(gps.length!==rootParts.length)return null;
  const out=[];for(let i=0;i<gps.length;i++){const g=gps[i],p=rootParts[i];
    /* the text and the glyphs must agree about accidentals, else leave this chord to the plain renderer */
    const fix=(which,L)=>{if(!L)return true;const hasT=/[#b]/.test(L[1]||''),hasG=!!g[which+'Acc'];
      if(hasG&&!hasT){if(which==='root')p.root=L[0]+g.rootAccV+L.slice(1);else p.bass=L[0]+g.bassAccV+L.slice(1);p.text=p.root+p.qual+(p.bass?'/'+p.bass:'');p.fixedAcc=true;return true;}
      if(hasT&&!hasG)return false;
      return true;};
    if(!fix('root',p.root)||!fix('bass',p.bass)){out.push(null);continue;}
    if(!!g.bass!==!!p.bass||g.root.w>1.15*g.root.h||(g.bass&&g.bass.w>1.15*g.bass.h)){out.push(null);continue;}
    out.push(g);}
  return out;};

/* a glyph scaled onto a small grid, for comparing shapes */
CC.resample=function(mask,w,h,G){G=G||20;const out=new Float32Array(G*G);
  for(let gy=0;gy<G;gy++){const y0=Math.floor(gy*h/G),y1=Math.max(y0+1,Math.floor((gy+1)*h/G));for(let gx=0;gx<G;gx++){const x0=Math.floor(gx*w/G),x1=Math.max(x0+1,Math.floor((gx+1)*w/G));let s=0,n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){s+=mask[y*w+x];n++;}out[gy*G+gx]=n?s/n:0;}}
  return out;};
CC.glyphSim=function(a,b){const G=20;const ra=a.w/a.h,rb=b.w/b.h,asp=Math.min(ra,rb)/Math.max(ra,rb);
  const A=a.grid||(a.grid=CC.resample(a.mask,a.w,a.h,G)),B=b.grid||(b.grid=CC.resample(b.mask,b.w,b.h,G));let d=0;for(let i=0;i<G*G;i++)d+=Math.abs(A[i]-B[i]);
  return (1-d/(G*G))*Math.pow(asp,0.5);};

/* the sheet's own letters and accidentals, one exemplar each, taken from chords read with confidence.
   entries: {mask,w,h} for letters; accidentals also carry their place next to the letter they followed */
CC.buildBank=function(chords,parsedOf){const cand={L:{},A:{}},bank={L:{},A:{}};
  chords.forEach(ch=>{const g=ch.g;if(!g||ch.status!=='ok')return;const p=parsedOf(ch);if(!p||!p.root)return;
    const add=(k,key,comp,ref)=>{if(!comp)return;(cand[k][key]=cand[k][key]||[]).push({comp,ref});};
    add('L',p.root[0],g.root,g.root);if(p.root[1])add('A',p.root[1],g.rootAcc,g.root);
    if(g.bass&&p.bass){add('L',p.bass[0],g.bass,g.bass);if(p.bass[1])add('A',p.bass[1],g.bassAcc,g.bass);}});
  const med=a=>{const b=a.slice().sort((p,q)=>p-q);return b[b.length>>1];};
  ['L','A'].forEach(k=>Object.keys(cand[k]).forEach(key=>{const arr=cand[k][key],r=med(arr.map(z=>z.comp.w/z.comp.h)),d=med(arr.map(z=>densOf(z.comp)));
    let best=null,bd=1e9;arr.forEach(z=>{const dd=Math.abs(z.comp.w/z.comp.h-r)*3+Math.abs(densOf(z.comp)-d);if(dd<bd){bd=dd;best=z;}});
    const c=best.comp,ref=best.ref;bank[k][key]={mask:c.mask||maskOf(c),w:c.w,h:c.h,n:arr.length,top:(c.y0-ref.y0)/ref.h,bot:(c.y1-ref.y1)/ref.h,wr:c.w/ref.h,gapr:(c.x0-ref.x1)/ref.h};}));
  return bank;};

/* does each letter look like the sheet's exemplar of what it was read as? returns {letter,score,bestLetter,bestScore} */
CC.checkLetter=function(comp,letter,bank){const me=bank.L[letter];let best=null,bs=-1;
  Object.keys(bank.L).forEach(L=>{const s=CC.glyphSim({mask:comp.mask||maskOf(comp),w:comp.w,h:comp.h,grid:comp.grid},bank.L[L]);comp.grid=comp.grid||CC.resample(comp.mask||maskOf(comp),comp.w,comp.h,20);if(s>bs){bs=s;best=L;}});
  const mine=me?CC.glyphSim({mask:comp.mask||maskOf(comp),w:comp.w,h:comp.h,grid:comp.grid},me):null;
  return {letter,score:mine,bestLetter:best,bestScore:bs};};

/* where each glyph goes once the letters are changed. pieces: {src,x,y,w,h} to draw from a mask, or {text,x,baseline,size} */
CC.layoutChord=function(g,newRoot,newBass,bank,measure){
  const pieces=[];let cx=g.x0;const ref=g.root;
  const letter=(L,r)=>{const b=bank.L[L];if(b){const w=b.w*(r.h/b.h);pieces.push({src:b,x:cx,y:r.y0,w,h:r.h});cx+=w;}
    else{const w=measure?measure(L,r.h):0.7*r.h;pieces.push({text:L,x:cx,baseline:r.y1,size:r.h});cx+=w;}};
  const accid=(v,r)=>{const b=bank.A[v];if(b){const x=cx+Math.max(0.02,b.gapr)*r.h,y0=r.y0+b.top*r.h,y1=r.y1+b.bot*r.h,w=b.wr*r.h;pieces.push({src:b,x,y:y0,w,h:y1-y0});cx=x+w;}
    else{const size=0.72*r.h,w=measure?measure(v==='#'?'#':'b',size):0.5*size;const x=cx+0.05*r.h;pieces.push({text:v==='#'?'#':'b',x,baseline:v==='#'?r.y1-0.12*r.h:r.y1,size});cx=x+w;}};
  letter(newRoot[0],ref);if(newRoot[1])accid(newRoot[1],ref);
  let origEnd=g.rootAcc?g.rootAcc.x1:g.root.x1;
  const copy=(cs)=>{cs.forEach(q=>{pieces.push({src:q,x:cx+(q.x0-origEnd),y:q.y0,w:q.w,h:q.h});});if(cs.length){const l=cs[cs.length-1];cx=cx+(l.x1-origEnd);origEnd=l.x1;}};
  copy(g.qual);
  if(g.slash){pieces.push({src:g.slash,x:cx+(g.slash.x0-origEnd),y:g.slash.y0,w:g.slash.w,h:g.slash.h});cx=cx+(g.slash.x1-origEnd);origEnd=g.slash.x1;}
  if(g.bass&&newBass){cx+=Math.max(0,g.bass.x0-origEnd);letter(newBass[0],g.bass);if(newBass[1])accid(newBass[1],g.bass);origEnd=g.bassAcc?g.bassAcc.x1:g.bass.x1;copy(g.after);}
  let y0=1e9,y1=-1e9;pieces.forEach(p=>{if(p.src){y0=Math.min(y0,p.y);y1=Math.max(y1,p.y+p.h);}else{y0=Math.min(y0,p.baseline-p.size);y1=Math.max(y1,p.baseline+0.1*p.size);}});
  return {pieces,x0:g.x0,x1:cx,y0,y1};};


/* for letters the sheet never prints: draw with whichever font looks most like the sheet's own letters.
   render(text,size,font) returns ImageData of the text drawn black on white */
CC.pickFont=function(bank,render,fonts){const Ls=Object.keys(bank.L).sort((a,b)=>bank.L[b].n-bank.L[a].n).slice(0,3);if(!Ls.length)return fonts[0];
  const glyph=id=>{const W=id.width,H=id.height,d=id.data;let x0=W,x1=-1,y0=H,y1=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(d[(y*W+x)*4]<128){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
    if(x1<0)return null;const w=x1-x0+1,h=y1-y0+1,m=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)m[y*w+x]=d[((y0+y)*W+x0+x)*4]<128?1:0;return {mask:m,w,h};};
  let best=fonts[0],bs=-1;fonts.forEach(f=>{let s=0,n=0;Ls.forEach(L=>{const g=glyph(render(L,40,f));if(!g)return;s+=CC.glyphSim(g,bank.L[L]);n++;});const v=n?s/n:0;if(v>bs){bs=v;best=f;}});
  return best;};

export default CC;


