'use client';

import {useEffect,useRef,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {TrialWorkspace} from './TrialWorkspace';
import styles from './kimatchum.module.css';

export function Workspace(){
  const params=useSearchParams();
  const [tab,setTab]=useState<'work'|'intake'>(params.has('request')?'intake':'work');
  const [intakeOpened,setIntakeOpened]=useState(params.has('request'));
  const frame=useRef<HTMLIFrameElement>(null);
  const [height,setHeight]=useState(2900);
  useEffect(()=>{
    function receive(event:MessageEvent){
      if(event.origin!==location.origin||event.source!==frame.current?.contentWindow)return;
      if(event.data?.type==='km-workspace-height'&&Number.isFinite(event.data.height))setHeight(Math.max(600,Math.min(30000,event.data.height)));
    }
    window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
  },[]);
  function select(next:'work'|'intake'){
    frame.current?.contentWindow?.postMessage({type:'km-workspace-stop'},location.origin);
    if(next==='intake')setIntakeOpened(true);setTab(next);
  }
  return <>
    <nav className={styles.workNav} aria-label="키맞춤 작업 선택">
      <button type="button" aria-pressed={tab==='work'} onClick={()=>select('work')}>악보 작업실</button>
      <button type="button" aria-pressed={tab==='intake'} onClick={()=>select('intake')}>접수 · 이메일 검수</button>
    </nav>
    <section hidden={tab!=='work'} aria-label="악보 작업실" className={styles.workArea}>
      <p className={styles.workNote}>이미지 올리기 → 싱어 음역과 키 비교 → 코드 확인·재생·저장. 작업은 이 브라우저에서 진행하며 새로고침하면 초기화됩니다.</p>
      <iframe ref={frame} title="키맞춤 악보 작업실" src="/kimatchum-engine/index.html?workspace=1" className={styles.workFrame} style={{height}}/>
    </section>
    {intakeOpened&&<section hidden={tab!=='intake'} aria-label="접수와 이메일 검수"><TrialWorkspace active={tab==='intake'}/></section>}
  </>;
}
