import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TrialWorkspace } from '@/components/kimatchum/TrialWorkspace';

export const metadata:Metadata={title:'키맞춤 시험 접수',robots:{index:false,follow:false}};
export default function KimatchumPage(){return <Suspense fallback={<p>접수 화면을 불러옵니다.</p>}><TrialWorkspace/></Suspense>;}
