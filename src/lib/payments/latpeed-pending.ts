import { createAdminClient } from '@/utils/supabase/admin';

export interface RecentLatpeedPaymentIntent {
  id: string;
  user_email: string;
  created_at: string;
  expires_at: string;
  status: string;
}

export async function getRecentLatpeedPaymentIntent(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('latpeed_payment_intents')
    .select('id, user_email, created_at, expires_at, status')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[Latpeed Pending] Failed to load pending payment intent:', error);
    return null;
  }

  return data as RecentLatpeedPaymentIntent | null;
}
