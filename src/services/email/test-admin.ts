import 'server-only';
import {createClient} from '@/utils/supabase/server';
import {getFullAdminEmails} from '@/lib/admin/access';

export async function getEmailTestAdmin(){
  const client=await createClient();
  const {data,error}=await client.auth.getUser();
  const user=data.user;
  if(error||user?.email!=='hmys0205hmys@gmail.com'||!user.email_confirmed_at||!getFullAdminEmails().includes(user.email.toLowerCase()))return null;
  return user;
}
