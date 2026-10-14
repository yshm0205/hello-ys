import {notFound} from 'next/navigation';
import {getEmailTestAdmin} from '@/services/email/test-admin';
import {EmailDebugForm} from '@/components/kimatchum/EmailDebugForm';
export default async function EmailDebugPage(){
  const user=await getEmailTestAdmin();
  if(!user?.email)notFound();
  return <EmailDebugForm recipient={user.email}/>;
}
