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
  } | null = null;

  try {
    const { data } = await supabase
      .from('user_plans')
      .select('credits, plan_type, expires_at')
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
