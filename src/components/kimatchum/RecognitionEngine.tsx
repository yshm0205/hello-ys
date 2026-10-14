'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {z} from 'zod';
const box=z.object({id:z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),text:z.string().max(80),sys:z.number().int().min(0),
  x0:z.number().min(0).max(1),x1:z.number().min(0).max(1),y0:z.number().min(0).max(1),y1:z.number().min(0).max(1)}).refine(b=>b.x0<b.x1&&b.y0<b.y1);
const output=z.object({draft:z.array(box).min(1).max(256),unmatched:z.number().int().min(0)});
export type Recognition=z.infer<typeof output>;
type Pending={readonly id:string;readonly resolve:(value:Recognition)=>void;readonly reject:(error:Error)=>void;readonly timer:ReturnType<typeof setTimeout>};
export function useRecognitionEngine(){
  const frame=useRef<HTMLIFrameElement>(null),pending=useRef<Pending|null>(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    function receive(event:MessageEvent){
      if(event.origin!==location.origin||event.source!==frame.current?.contentWindow)return;
      const envelope=z.object({type:z.string(),id:z.string().optional(),error:z.string().optional(),result:z.unknown().optional()}).safeParse(event.data);
      if(!envelope.success)return;const value=envelope.data;
      if(value.type==='km-engine-ready'){setReady(true);return;}
      const current=pending.current;if(value.type!=='km-recognized'||!current||value.id!==current.id)return;
      clearTimeout(current.timer);pending.current=null;
      const parsed=output.safeParse(value.result);
      if(value.error||!parsed.success){current.reject(new Error(value.error||'인식 결과 형식을 확인해 주세요.'));return;}
      current.resolve(parsed.data);
    }
    window.addEventListener('message',receive);
    frame.current?.contentWindow?.postMessage({type:'km-engine-ping'},location.origin);
    return()=>{window.removeEventListener('message',receive);const current=pending.current;if(current){clearTimeout(current.timer);current.reject(new Error('인식 화면이 닫혔습니다.'));pending.current=null;}};
  },[]);
  const recognize=useCallback(async(image:string,mode:'browser'|'gemini')=>{
    if(!ready||!frame.current?.contentWindow)throw new Error('인식 엔진을 준비하고 있습니다.');
    if(pending.current)throw new Error('현재 인식이 끝난 뒤 다시 시도해 주세요.');
    const target=frame.current.contentWindow,id=crypto.randomUUID();
    return new Promise<Recognition>((resolve,reject)=>{
      const timer=setTimeout(()=>{pending.current=null;reject(new Error('인식 시간이 초과되었습니다. 기존 결과는 보존됩니다.'));},180000);
      pending.current={id,resolve,reject,timer};target.postMessage({type:'km-recognize',id,image,mode},location.origin);
    });
  },[ready]);
  return {ready,recognize,element:<iframe ref={frame} title="키맞춤 자동 인식 엔진" src="/kimatchum-engine/index.html" onLoad={()=>frame.current?.contentWindow?.postMessage({type:'km-engine-ping'},location.origin)} className="hidden" aria-hidden="true"/>};
}
