import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { getAdminAccessLevel, type AdminAccessLevel } from '@/lib/admin/access';
import { getEffectiveCreditInfo } from '@/lib/plans/server';
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
  let adminAccessLevel: AdminAccessLevel = 'none';

  initialCreditInfo = await getEffectiveCreditInfo(user.id);
  adminAccessLevel = getAdminAccessLevel(user.email, user.user_metadata);

  return (
    <DashboardLayout
      user={{ email: user.email ?? undefined }}
      initialCreditInfo={initialCreditInfo}
      adminAccessLevel={adminAccessLevel}
    >
      {children}
    </DashboardLayout>
  );
}
