(function(root){
'use strict';
const mod=(n,d)=>((n%d)+d)%d;
function fullRange(notes){
  const values=notes.filter(Number.isFinite),hist={};
  values.forEach(n=>{hist[n]=(hist[n]||0)+1;});
  return values.length?{lo:Math.min(...values),hi:Math.max(...values),hist,outLo:null,outHi:null}:null;
}
function candidates(song,team){
  const st={cL:Math.max(...team.map(p=>p.lo)),cH:Math.min(...team.map(p=>p.hi)),uL:Math.min(...team.map(p=>p.lo)),uH:Math.max(...team.map(p=>p.hi))};
  const res=Array.from({length:12},(_,k)=>{
    const sourceKey=song.noteKey??song.key;
    const shifts=[mod(k-sourceKey,12),mod(k-sourceKey,12)-12];
    return shifts.map(s=>{
      const L=song.lo+s,H=song.hi+s,below=Math.max(0,st.cL-L),above=Math.max(0,H-st.cH);
      let outside=0;Object.entries(song.hist||{}).forEach(([m,n])=>{if(+m+s<st.cL||+m+s>st.cH)outside+=n;});
      return {k,s,L,H,below,above,unc:below+above,score:below*4+above*5+outside*.1,nB:0,nA:0};
    }).sort((a,b)=>a.score-b.score||Math.abs(a.s)-Math.abs(b.s))[0];
  });
  return {res,best:res.slice().sort((a,b)=>a.score-b.score||Math.abs(a.s)-Math.abs(b.s))[0],st};
}
function recognition(text){
  const raw=String(text||'').trim().replace(/♯/g,'#').replace(/♭/g,'b');
  const repeat=/^\s*\d+[.)]\s*/.test(raw),clean=raw.replace(/^\s*\d+[.)]\s*/,'').replace(/\s+/g,'');
  const valid=/^[A-G](?:#|b)?(?:(?:maj|min|m|M|sus|add|dim|aug)?\d*(?:[#b]\d+)?|m7b5|°|\+)(?:\/[A-G](?:#|b)?)?$/.test(clean);
  return {raw,text:clean,valid,repeat,reason:repeat?'반복 번호와 코드 경계를 확인해 주세요':/[#b/]/.test(clean)?'임시표·분수코드를 원본과 대조해 주세요':'원본과 코드 이름을 대조해 주세요'};
}
function attachBoxes(chords,tokens){
  tokens.forEach((t,i)=>{if(!t.id)t.id='box-'+t.sys+'-'+i;});
  chords.forEach((c,i)=>{
    const matches=tokens.filter(t=>t.sys===c.sys&&t.x0<c.x1&&t.x1>c.x0);
    const token=c.boxId?tokens.find(t=>t.id===c.boxId):(matches.length===1?matches[0]:null);
    if(token&&!c.boxId)c.boxId=token.id;
    if(!c.id)c.id=(token?token.id:'manual-'+c.sys)+'-chord-'+i;
    if(!c.sourceBox)c.sourceBox=Object.freeze({x0:c.x0,x1:c.x1,y0:c.y0,y1:c.y1});
    if(c.reviewed===undefined)c.reviewed=!!c.manual;
    if(c.overlaySafe===undefined)c.overlaySafe=!!c.manual;
  });
}
function mergeRecognition(chords,tokens,lines,parse){
  attachBoxes(chords,tokens);let applied=0,unmatched=0;
  for(const line of lines){
    const ts=tokens.filter(t=>t.sys===Number(line.line)-1),groups=new Map();
    for(const answer of line.chords||[]){const id=Number(answer.n);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(answer);}
    for(const [n,answers] of groups){
      const candidates=ts.filter(t=>t.n===n),token=candidates[0];if(candidates.length!==1||answers.length!==1||tokens.filter(t=>t.id===token.id).length!==1){unmatched+=answers.length;continue;}
      const matches=chords.filter(c=>c.boxId===token.id||(c.sys===token.sys&&c.x0<token.x1&&c.x1>token.x0));
      if(matches.length>1||(matches[0]?.boxId&&matches[0].boxId!==token.id)){unmatched++;continue;}
      const old=matches[0];if(old?.reviewed){continue;}
      const r=recognition(answers[0].chord),p=parse(r.text);
      if(!r.valid||!p||!p.root||!p.ok){unmatched++;continue;}
      const c=old||{sys:token.sys,x0:token.x0,x1:token.x1,y0:token.y0,y1:token.y1,base:token.base,h:token.h,boxId:token.id,id:token.id+'-chord'};
      c.text=p.text;c.ai=true;c.g=null;c.status='check';c.reviewed=false;c.overlaySafe=false;
      c.reviewReason=r.reason;c.rawAI=r.raw;applied++;
      if(!old)chords.push(c);
    }
  }
  attachBoxes(chords,tokens);return {applied,unmatched};
}
function playableChord(CC,text){const p=CC.parseChord(text);return p&&p.root&&p.ok?p:null;}
function chordVoicing(CC,text,shift,key,sourceKey){
  const p=playableChord(CC,text);if(!p)return null;
  const label=CC.transpose(p,shift,key,sourceKey),q=CC.parseChord(label),tones=CC.tones(q);
  const root=50+mod(tones.root-2,12),bass=40+mod(tones.bass-4,12);
  return {label,notes:tones.iv.map(i=>root+i),bass};
}
function mergeFixedRecognition(chords,tokens,results,parse){
  attachBoxes(chords,tokens);const groups=new Map();let applied=0,unmatched=0;
  for(const answer of results){const list=groups.get(answer.box_id)||[];list.push(answer);groups.set(answer.box_id,list);}
  for(const [id,answers] of groups){
    const token=tokens.find(t=>t.id===id),matches=chords.filter(c=>c.boxId===id);
    if(!token||answers.length!==1||matches.length>1){unmatched+=answers.length;continue;}
    const old=matches[0];if(old?.reviewed)continue;
    const answer=answers[0],r=recognition(answer.text),p=r.valid?parse(r.text):null;
    if(!answer.valid_chord||!p?.ok){unmatched++;continue;}
    const c=old||{sys:token.sys,x0:token.x0,x1:token.x1,y0:token.y0,y1:token.y1,base:token.base,h:token.h,boxId:id,id:id+'-chord'};
    Object.assign(c,{text:p.text,ocrText:p.text,rawOCR:answer.raw_text,status:'check',reviewed:false,overlaySafe:false,confidence:answer.confidence,reviewReason:answer.reason,g:null});
    if(!old)chords.push(c);applied++;
  }
  attachBoxes(chords,tokens);return {applied,unmatched};
}
class Transport {
  constructor(hooks){this.hooks=hooks;this.state='stopped';this.position=0;this.events=[];this.voices=[];this.timer=null;this.generation=0;}
  clear(){if(this.timer!==null){this.hooks.clear(this.timer);this.timer=null;}this.voices.forEach(v=>this.hooks.cancel(v));this.voices=[];this.generation++;}
  stop(){this.clear();this.state='stopped';this.position=0;this.hooks.state(this.state);}
  start(events){this.stop();this.events=events.slice().sort((a,b)=>a.at-b.at);if(!this.events.length)return;this.position=0;this.resume();}
  pause(){if(this.state!=='playing')return;this.position=Math.max(0,this.hooks.now()-this.origin);this.clear();this.state='paused';this.hooks.state(this.state);}
  resume(){
    if(this.state==='playing'||!this.events.length)return;
    this.clear();this.origin=this.hooks.now()-this.position;this.state='playing';
    this.pending=this.events.filter(e=>e.at+e.duration>this.position);this.hooks.state(this.state);
    const generation=this.generation;
    const tick=()=>{
      if(generation!==this.generation||this.state!=='playing')return;
      const pos=this.hooks.now()-this.origin;
      while(this.pending.length&&this.pending[0].at<=pos+.10){const e=this.pending.shift(),offset=Math.max(0,pos-e.at),duration=e.duration-offset;
        if(duration>0)this.voices.push(this.hooks.play(e,Math.max(this.hooks.now(),this.origin+e.at),duration));}
      const current=this.events.filter(e=>e.at<=pos&&e.at+e.duration>pos).at(-1);if(current)this.hooks.show(current);
      const end=Math.max(...this.events.map(e=>e.at+e.duration));if(pos>=end+.15)this.stop();
    };
    this.timer=this.hooks.every(tick,40);tick();
  }
}
const api={fullRange,candidates,recognition,attachBoxes,mergeRecognition,mergeFixedRecognition,playableChord,chordVoicing,Transport};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PracticeCore=api;
})(typeof window!=='undefined'?window:globalThis);
