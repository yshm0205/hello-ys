import { redirect } from 'next/navigation';

interface ScriptGeneratorPageProps {
    params: Promise<{ locale: string }>;
}

export default async function ScriptGeneratorPage({ params }: ScriptGeneratorPageProps) {
    const { locale } = await params;
    redirect(`/${locale}/dashboard/scripts-v2`);
}
