import { LecturesContent } from '@/components/dashboard/LecturesContent';
import { getPublishedLectureChapters } from '@/lib/lectures/server';

export default async function LecturesPage() {
    const chapters = await getPublishedLectureChapters();

    return <LecturesContent chapters={chapters} />;
}
