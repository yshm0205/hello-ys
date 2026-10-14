import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TrialWorkspace } from '@/components/kimatchum/TrialWorkspace';

export const metadata:Metadata={title:{absolute:'키맞춤 · 악보 작업실'},description:'악보의 코드를 검수하고 목표 키의 코드 이미지와 확인용 반주를 만드는 키맞춤 시험 공간. 오선 음표는 원키로 유지됩니다.',authors:[{name:'키맞춤'}],creator:'키맞춤',openGraph:{title:'키맞춤 · 악보 작업실',description:'악보 코드 검수와 코드 전조',images:[]},twitter:{title:'키맞춤 · 악보 작업실',description:'악보 코드 검수와 코드 전조',images:[]},robots:{index:false,follow:false}};
export default function KimatchumPage(){return <Suspense fallback={<p>접수 화면을 불러옵니다.</p>}><TrialWorkspace/></Suspense>;}
