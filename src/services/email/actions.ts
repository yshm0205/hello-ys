'use server';
import {z} from 'zod';
import {getEmailTestAdmin} from './test-admin';
import {sendWelcomeEmail} from './server';
export async function sendDebugWelcomeEmail(input:unknown){
  const user=await getEmailTestAdmin();
  if(!user?.email)return {error:'Forbidden'};
  const parsed=z.object({userName:z.string().trim().min(1).max(80)}).strict().safeParse(input);
  if(!parsed.success)return {error:'Invalid input'};
  return sendWelcomeEmail({email:user.email,userName:parsed.data.userName,planName:'Pro (Debug Test)',locale:'ko'});
}
