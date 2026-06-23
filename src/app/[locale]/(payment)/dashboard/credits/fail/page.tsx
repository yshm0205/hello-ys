import { redirect } from 'next/navigation';

interface PaymentFailPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PaymentFailPage({ params }: PaymentFailPageProps) {
  const { locale } = await params;
  redirect(`/${locale}?payment=failed`);
}
