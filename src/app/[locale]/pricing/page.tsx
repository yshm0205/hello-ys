import { redirect } from 'next/navigation';

export default function PricingPage() {
  redirect('/checkout/allinone?intent=pay');
}
