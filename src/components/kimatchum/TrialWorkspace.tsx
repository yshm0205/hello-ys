'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CC from '@/lib/kimatchum/chord-core.mjs';
import policy from '@/lib/kimatchum/chord-support.json';
import {useRecognitionEngine} from './RecognitionEngine';

type Box={id:string;text:string;x0:number;x1:number;y0:number;y1:number;sys:number;source_ids?:string[]};
type Result={source_key:number;note_key:number;target_key:number;bpm:number;beats:3|4;notes:string;chords:Box[]};
type Job={id:string;title:string;state:string;version:number;draft:Box[];result:Result|null;approved_at?:string;delivery?:string};
type Row=Pick<Job,'id'|'title'|'state'|'version'>;
const EMAIL='hmys0205hmys@gmail.com';
const KEYS=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const states:Record<string,string>={awaiting_email:'이메일 확인 대기',queued:'검수 대기',reviewing:'검수 중',completed:'검수 완료'};
const delivery:Record<string,string>={pending:'이메일 발송 대기',sending:'발송 결과 확인 중',accepted:'메일 공급자가 접수함',unknown:'발송 결과 불명확 · 자동 재시도 안 함',rejected:'메일 공급자가 거절함',blocked:'메일 발송 차단'};
const field='w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

async function api(path:string,data?:unknown){
  const response=await fetch('/api/kimatchum/trial/'+path,{method:data===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',
    headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
  const body=await response.json();if(!response.ok)throw new Error(body.error||'요청을 처리하지 못했습니다.');return body;
}
function validChord(text:string){const p=CC.parseChord(text);return p?.root&&p.ok&&policy.qualities.includes(p.qual)?p:null;}

export function TrialWorkspace(){
  const engine=useRecognitionEngine();
  const [suggestions,setSuggestions]=useState<Record<string,string>>({});
  const locale=useLocale();const params=useSearchParams();
  const [ready,setReady]=useState(false),[signedIn,setSignedIn]=useState(false),[busy,setBusy]=useState('');
  const [notice,setNotice]=useState('시험 접수 연결을 확인합니다.'),[error,setError]=useState('');
  const [rows,setRows]=useState<Row[]>([]),[job,setJob]=useState<Job|null>(null);
  const [title,setTitle]=useState(''),[image,setImage]=useState(''),[draft,setDraft]=useState<Box[]>([]),[consent,setConsent]=useState(false);
  const [edits,setEdits]=useState<Box[]>([]),[confirmed,setConfirmed]=useState(false);
  const [settings,setSettings]=useState<Result>({source_key:0,note_key:0,target_key:0,bpm:90,beats:4,notes:'',chords:[]});
  const [verification,setVerification]=useState(''),[playing,setPlaying]=useState(false);
  const canvas=useRef<HTMLCanvasElement>(null);const pointer=useRef<{x:number;y:number}|null>(null);
  const imageElement=useRef<HTMLImageElement>(null);const audio=useRef<AudioContext|null>(null);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const idem=useRef('');const blob=useRef('');
  const sourceBlob=useRef<Blob|null>(null);
  const stop=useCallback(()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;
    if(audio.current){void audio.current.close();audio.current=null;}setPlaying(false);},[]);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);void audio.current?.close();if(blob.current)URL.revokeObjectURL(blob.current);},[]);

  const open=useCallback(async(id:string)=>{
    const value=await api('requests/'+id);setJob(value);setEdits(value.result?.chords||value.draft);setConfirmed(false);
    setSettings(value.result||{source_key:0,note_key:0,target_key:0,bpm:90,beats:4,notes:'',chords:[]});setSuggestions({});
    const response=await fetch('/api/kimatchum/trial/requests/'+id+'/image',{cache:'no-store'});
    if(!response.ok)throw new Error('원본 이미지를 불러오지 못했습니다.');
    if(blob.current)URL.revokeObjectURL(blob.current);sourceBlob.current=await response.blob();blob.current=URL.createObjectURL(sourceBlob.current);setImage(blob.current);
  },[]);
  const refresh=useCallback(async()=>{const result=await api('requests');setRows(result.jobs);},[]);
  useEffect(()=>{let active=true;
    void (async()=>{try{const capabilities=await api('capabilities');if(!active)return;
      setReady(capabilities.enabled);if(!capabilities.enabled){setNotice('시험 접수 준비 중입니다. 운영 저장소와 검수 계정 확인 후 이용할 수 있습니다.');return;}
      await api('session');if(!active)return;setSignedIn(true);setNotice('본인 계정 전용 시험입니다. 검수는 사람이 직접 시작하고 승인합니다.');
      await refresh();const id=params.get('request');if(id&&/^[a-f0-9]{32}$/.test(id))await open(id);
      const hash=new URLSearchParams(location.hash.slice(1));const token=hash.get('km-verify');if(token){setVerification(token);history.replaceState(null,'',location.pathname+location.search);}
    }catch(e){if(active)setError(e instanceof Error?e.message:'연결을 확인하지 못했습니다.');}})();
    return()=>{active=false;};
  },[open,params,refresh]);
  async function action(name:string,work:()=>Promise<void>){if(busy)return;setBusy(name);setError('');try{await work();}catch(e){setError(e instanceof Error?e.message:'처리하지 못했습니다.');}finally{setBusy('');}}
  async function dispatch(){const result=await api('dispatch',{});setNotice(result.state==='idle'?'발송 대기 항목이 없습니다.':delivery[result.state]||'메일 처리 상태를 확인해 주세요.');}
  async function readImage(value:string,mode:'browser'|'gemini'){
    const result=await engine.recognize(value,mode);setConfirmed(false);
    if(!job){setDraft(result.draft);setSuggestions(Object.fromEntries(result.draft.map(b=>[b.id,b.text])));}
    else {
      const matched:Record<string,string>={};let unmatched=result.unmatched;
      for(const candidate of result.draft){const original=job.draft.find(b=>b.sys===candidate.sys&&Math.abs(b.x0-candidate.x0)<.003&&Math.abs(b.x1-candidate.x1)<.003&&Math.abs(b.y0-candidate.y0)<.003&&Math.abs(b.y1-candidate.y1)<.003);
        if(original&&!matched[original.id])matched[original.id]=candidate.text;else unmatched++;}
      setSuggestions(matched);setNotice('재인식 제안을 원본·접수 코드와 비교하여 직접 수정하세요. 자동 적용하지 않았습니다. 위치 미대응 '+unmatched+'개.');return;
    }
    setNotice('자동 인식 '+result.draft.length+'개. 원본과 비교하여 수정한 뒤 접수하세요. 위치 미대응 '+result.unmatched+'개.');
  }
  async function selectFile(file:File|undefined){if(!file)return;if(file.size>6*1024*1024){setError('이미지는 6MiB 이하로 올려 주세요.');return;}
    stop();setJob(null);setDraft([]);setEdits([]);setSuggestions({});setConfirmed(false);idem.current=crypto.randomUUID().replaceAll('-','');
    const value=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('이미지를 읽지 못했습니다.'));reader.readAsDataURL(file);});
    setImage(value);const result=await engine.recognize(value,'browser');setDraft(result.draft);setSuggestions(Object.fromEntries(result.draft.map(b=>[b.id,b.text])));
    setNotice('자동 OCR 완료. 원본과 인식 코드를 비교하고 수정해 주세요.');
  }
  async function reread(mode:'browser'|'gemini'){
    let value=image;
    if(!value.startsWith('data:')){const data=sourceBlob.current;if(!data)throw new Error('원본을 다시 열어 주세요.');value=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('원본을 읽지 못했습니다.'));reader.readAsDataURL(data);});}
    await readImage(value,mode);
  }
  function point(event:React.PointerEvent<HTMLImageElement>){const r=event.currentTarget.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(event.clientY-r.top)/r.height))};}
  function mark(event:React.PointerEvent<HTMLImageElement>){if(job||!pointer.current)return;const end=point(event),start=pointer.current;pointer.current=null;
    if(Math.abs(end.x-start.x)<.005||Math.abs(end.y-start.y)<.005)return;
    setDraft(old=>[...old,{id:'box-'+crypto.randomUUID(),text:'',x0:Math.min(start.x,end.x),x1:Math.max(start.x,end.x),y0:Math.min(start.y,end.y),y1:Math.max(start.y,end.y),sys:0}]);}
  useEffect(()=>{if(!job?.result||!image||!canvas.current)return;const result=job.result;
    const img=new Image();img.onload=()=>{const c=canvas.current;if(!c)return;c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');if(!ctx)return;
      ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0);for(const box of result.chords){const parsed=validChord(box.text);if(!parsed)continue;
        const label=CC.transpose(parsed,result.target_key-result.source_key,result.target_key,result.source_key);
        const x=box.x0*c.width,y=box.y0*c.height,w=(box.x1-box.x0)*c.width,h=(box.y1-box.y0)*c.height;
        ctx.fillStyle='white';ctx.fillRect(x,y,w,h);ctx.fillStyle='black';ctx.font=`600 ${Math.max(10,h*.8)}px sans-serif`;ctx.textBaseline='top';ctx.fillText(label,x,y,w);}
    };img.src=image;
  },[job,image]);
  async function play(){if(!job?.result)return;stop();const result=job.result;
    if(result.chords.some(b=>!validChord(b.text))){setError('지원하지 않는 코드가 있어 재생할 수 없습니다.');return;}
    const ctx=new AudioContext();audio.current=ctx;await ctx.resume();setPlaying(true);let i=0;
    const next=()=>{if(audio.current!==ctx)return;if(i>=result.chords.length){stop();return;}
      const p=validChord(result.chords[i++].text)!;const shifted=CC.parseChord(CC.transpose(p,result.target_key-result.source_key,result.target_key,result.source_key))!;
      const tones=CC.tones(shifted),duration=60/result.bpm*result.beats;
      for(const midi of [36+tones.bass,...tones.iv.map(n=>48+tones.root+n)]){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.value=440*2**((midi-69)/12);
        gain.gain.setValueAtTime(.04,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration*.9);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+duration);}
      timer.current=setTimeout(next,duration*1000);};next();}
  function changeBoxes(index:number,merge:boolean){
    const current=job?edits:draft;
    const first=current[index],next=current[index+1];
    if(!first||(job&&job.state!=='reviewing'))return;
    if(merge&&(!next||first.sys!==next.sys))return;
    const updated=merge?current.map((box,i)=>i===index?{...first,
      x0:Math.min(first.x0,next.x0),x1:Math.max(first.x1,next.x1),
      y0:Math.min(first.y0,next.y0),y1:Math.max(first.y1,next.y1),
      ...(job?{source_ids:[...(first.source_ids||[first.id]),...(next.source_ids||[next.id])]}:{})}:box).filter((_,i)=>i!==index+1)
      :current.filter((_,i)=>i!==index);
    (job?setEdits:setDraft)(updated);setConfirmed(false);setSuggestions({});
    setNotice(merge?'영역을 합쳤습니다. 원본과 비교해 코드명을 직접 수정해 주세요.':'영역을 삭제했습니다. 남은 코드와 순서를 확인해 주세요.');
  }
  const boxes=job?edits:draft;
  const reviewable=job?.state==='reviewing';
  const allValid=edits.length>0&&edits.every(b=>!!validChord(b.text));
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 text-foreground">
    {engine.element}<header className="space-y-2"><p className="text-sm text-muted-foreground">FlowSpot · 본인 계정 시험</p><h1 className="text-3xl font-semibold">키맞춤 접수와 검수</h1>
      <p className="text-base text-muted-foreground">악보 이미지를 접수하고 코드를 확인한 뒤 결과를 이메일로 안내합니다. 결과는 코드 이미지와 반주이며, 오선 음표 전체를 전조하지 않습니다.</p></header>
    <Card><CardContent className="space-y-3 pt-6"><p role="status">{busy?`${busy} 중…`:notice}</p>{error&&<p role="alert" className="text-destructive">{error}</p>}
      {!signedIn&&<Button asChild variant="outline"><a href={`/${locale}/login?redirect=${encodeURIComponent('/kimatchum'+(params.get('request')?'?request='+params.get('request'):''))}`}>기존 FlowSpot 계정으로 로그인</a></Button>}
      {!ready&&<p className="text-sm text-muted-foreground">준비 중에는 접수·승인·이메일 발송이 차단됩니다.</p>}
    </CardContent></Card>
    {signedIn&&<><section className="flex flex-wrap items-center gap-3"><Button variant="outline" disabled={!!busy} onClick={()=>void action('목록 확인',refresh)}>접수 목록 새로고침</Button>
      <Button variant="outline" disabled={!!busy} onClick={()=>void action('메일 처리',dispatch)}>발송 대기 메일 처리</Button><span className="text-sm text-muted-foreground">수신: {EMAIL}</span></section>
      <ul className="space-y-2" aria-label="내 접수 목록">{rows.map(row=><li key={row.id}><Button variant="outline" disabled={!!busy} className="h-auto w-full justify-between whitespace-normal py-3 text-left" onClick={()=>void action('접수 열기',async()=>{stop();await open(row.id);})}><span>{row.title||'제목 없는 악보'}</span><span className="ml-4 text-sm">{states[row.state]||row.state}</span></Button></li>)}</ul>
      {!rows.length&&<p className="text-muted-foreground">아직 접수한 악보가 없습니다.</p>}
      <Card><CardHeader><CardTitle>{job?`${job.title} · ${states[job.state]}`:'새 악보 접수'}</CardTitle></CardHeader><CardContent className="space-y-4">
        <div><label htmlFor="score-file" className="mb-2 block text-sm font-medium">새 악보 이미지</label><Input id="score-file" type="file" accept="image/png,image/jpeg" disabled={!!busy||!engine.ready} onChange={e=>void action('자동 OCR',()=>selectFile(e.target.files?.[0]))}/></div>
        {!job&&<><label className="block space-y-2"><span>곡 제목</span><Input value={title} maxLength={120} onChange={e=>setTitle(e.target.value)}/></label><p className="text-sm text-muted-foreground">업로드하면 기존 브라우저 OCR로 코드 영역과 문자를 자동 인식합니다. 틀린 코드는 원본과 비교해 수정하세요. 인식 실패 시 영역을 직접 드래그하여 보완할 수 있습니다.</p></>}
        {image&&(!job||reviewable)&&<div className="flex flex-wrap gap-3"><Button variant="outline" disabled={!!busy||!engine.ready} onClick={()=>void action('브라우저 OCR',()=>reread('browser'))}>OCR 다시 읽기</Button><Button variant="outline" disabled={!!busy||!engine.ready} onClick={()=>void action('Gemini 재인식',()=>reread('gemini'))}>Gemini 재인식 (이미지 전송·API 비용)</Button></div>}
        {image&&<div className="grid min-w-0 gap-6 lg:grid-cols-2"><div className="relative min-w-0 self-start">
          {/* Private owner image is deliberately not passed through a public image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imageElement} src={image} alt="검수할 원본 악보. 표시한 코드 영역과 함께 확인하세요." width={800} height={1100} className="h-auto w-full rounded-md bg-white" draggable={false}
            onPointerDown={e=>{if(!job){pointer.current=point(e);e.currentTarget.setPointerCapture(e.pointerId);}}} onPointerUp={mark} style={{touchAction:job?'auto':'none'}}/>
          {boxes.map((box,i)=><span key={box.id} className="pointer-events-none absolute bg-primary/10 text-xs font-semibold" style={{left:`${box.x0*100}%`,top:`${box.y0*100}%`,width:`${(box.x1-box.x0)*100}%`,height:`${(box.y1-box.y0)*100}%`}}>{i+1}</span>)}
        </div><div className="min-w-0 space-y-4">
          <h2 className="text-xl font-semibold">코드 확인</h2>
          {boxes.map((box,i)=><label className="block space-y-2" key={box.id}><span className="text-sm">영역 {i+1}</span>{job&&<span className="block text-sm text-muted-foreground">접수 코드: {job.draft.find(b=>b.id===box.id)?.text}</span>}{suggestions[box.id]&&<span className="block text-sm text-muted-foreground">인식 결과: {suggestions[box.id]} · 원본과 비교 후 아래에 입력</span>}<Input aria-label={`영역 ${i+1}`} value={box.text} disabled={!!job&&!reviewable} maxLength={32} aria-invalid={!!box.text&&!validChord(box.text)} onChange={e=>{const text=e.target.value;(job?setEdits:setDraft)(old=>old.map(b=>b.id===box.id?{...b,text}:b));setConfirmed(false);}}/>{(!job||reviewable)&&<span className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={!!busy||boxes.length===1} aria-label={`영역 ${i+1} 삭제`} onClick={()=>changeBoxes(i,false)}>영역 삭제</Button><Button type="button" variant="outline" disabled={!!busy||!boxes[i+1]||box.sys!==boxes[i+1].sys} aria-label={`영역 ${i+1} 다음 영역과 병합`} onClick={()=>changeBoxes(i,true)}>다음 영역과 병합</Button></span>}{box.text&&!validChord(box.text)&&<span className="text-sm text-destructive">지원되는 코드로 수정해 주세요.</span>}</label>)}
          {!boxes.length&&<p>코드 글자가 있는 영역을 표시해 주세요.</p>}
          {reviewable&&<><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{(['source_key','note_key','target_key'] as const).map((key,i)=><label key={key} className="space-y-2 text-sm"><span>{['원래 코드 키','원래 음표 키','목표 키'][i]}</span><select className={field} value={settings[key]} onChange={e=>{setSettings(s=>({...s,[key]:Number(e.target.value)}));setConfirmed(false);}}>{KEYS.map((label,value)=><option key={value} value={value}>{label}</option>)}</select></label>)}</div>
            <div className="grid grid-cols-2 gap-3"><label>빠르기<Input type="number" min={30} max={220} value={settings.bpm} onChange={e=>{setSettings(s=>({...s,bpm:Number(e.target.value)}));setConfirmed(false);}}/></label><label>박자<select className={field} value={settings.beats} onChange={e=>{setSettings(s=>({...s,beats:Number(e.target.value) as 3|4}));setConfirmed(false);}}><option value={3}>3/4</option><option value={4}>4/4</option></select></label></div>
            <label className="block space-y-2"><span>검수 메모</span><textarea className={field} maxLength={2000} value={settings.notes} onChange={e=>setSettings(s=>({...s,notes:e.target.value}))}/></label>
            <label className="flex items-start gap-3"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>원본과 모든 코드·영역·키·박자를 확인했습니다. 승인하면 이 결과가 저장됩니다.</span></label>
            <p className="text-sm text-muted-foreground">검수 버전 {job.version} · 승인 후 결과 메일은 별도 발송 대기 상태로 저장됩니다.</p>
            <Button disabled={!!busy||!confirmed||!allValid} onClick={()=>void action('검수 승인',async()=>{await api(`review/${job.id}/complete`,{...settings,version:job.version,review_confirmed:true,chords:edits.map(({id,text,source_ids})=>({id,text,...(source_ids?{source_ids}:{})})),removed_ids:job.draft.filter(b=>!edits.some(e=>(e.source_ids||[e.id]).includes(b.id))).map(b=>b.id)});await open(job.id);await refresh();})}>검수 결과 승인</Button></>}
        </div></div>}
        {!job&&<><label className="flex items-start gap-3"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>본인 이메일과 악보 이미지를 검수 목적으로 저장하는 데 동의합니다.</span></label>
          <Button disabled={!!busy||!consent||!image||!draft.length||draft.some(b=>!validChord(b.text))} onClick={()=>void action('악보 접수',async()=>{const response=await api('requests',{email:EMAIL,title,image,draft,consent,idempotency_key:idem.current});await open(response.id);await refresh();setNotice('접수되었습니다. 메일 처리 결과와 접수 상태를 확인해 주세요.');})}>본인 이메일로 접수</Button></>}
        {job?.state==='awaiting_email'&&<><p>확인 이메일의 링크를 연 뒤 아래 버튼을 눌러 주세요. 로그인도 필요합니다.</p><Button disabled={!!busy||!verification} onClick={()=>void action('이메일 확인',async()=>{await api(`requests/${job.id}/verify`,{token:verification});setVerification('');await open(job.id);await refresh();})}>이메일 확인 완료</Button></>}
        {job?.state==='queued'&&<><p>검수 대기 중입니다. 사람이 직접 검수를 시작해야 진행됩니다.</p><Button disabled={!!busy} onClick={()=>void action('검수 시작',async()=>{await api(`review/${job.id}/claim`,{});await open(job.id);await refresh();})}>검수 시작</Button></>}
      </CardContent></Card>
      {job?.result&&<Card><CardHeader><CardTitle>승인된 결과</CardTitle></CardHeader><CardContent className="space-y-4"><p>{delivery[job.delivery||'pending']||'메일 상태 확인 필요'} · 승인 {job.approved_at}</p><canvas ref={canvas} className="h-auto w-full" aria-label="검수 후 전조한 코드 이미지"/><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={()=>{const c=canvas.current;if(!c)return;const link=document.createElement('a');link.download='kimatchum-reviewed.png';link.href=c.toDataURL('image/png');link.click();}}>코드 이미지 저장</Button><Button onClick={()=>void play()} disabled={playing}>코드 반주 듣기</Button><Button variant="outline" onClick={stop} disabled={!playing}>멈추기</Button></div><p className="text-sm text-muted-foreground">코드당 한 마디로 재생하는 확인용 반주입니다. 멜로디와 반복기호 해석은 포함하지 않습니다.</p></CardContent></Card>}
    </>}
  </main>;
}
