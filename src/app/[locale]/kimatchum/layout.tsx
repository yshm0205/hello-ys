import { KimatchumShell } from '@/components/kimatchum/KimatchumShell';

export default async function KimatchumLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}) {
  const {locale}=await params;
  return <KimatchumShell locale={locale}>{children}</KimatchumShell>;
}
