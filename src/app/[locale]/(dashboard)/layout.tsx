import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

interface DashboardGroupLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardGroupLayout({
  children,
}: DashboardGroupLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let initialCreditInfo: {
    credits: number;
    plan_type: string;
    expires_at: string | null;
    monthly_credit_amount?: number | null;
    monthly_credit_total_cycles?: number | null;
    monthly_credit_granted_cycles?: number | null;
    next_credit_at?: string | null;
  } | null = null;

  try {
    const { data } = await supabase
      .from('user_plans')
      .select(
        'credits, plan_type, expires_at, monthly_credit_amount, monthly_credit_total_cycles, monthly_credit_granted_cycles, next_credit_at',
      )
      .eq('user_id', user.id)
      .single();

    initialCreditInfo = data;
  } catch {
    // Ignore missing plan rows and fall back to null.
  }

  return (
    <DashboardLayout
      user={{ email: user.email ?? undefined }}
      initialCreditInfo={initialCreditInfo}
    >
      {children}
    </DashboardLayout>
  );
}
