import { getAllPosts } from "@/lib/blog/api";
import { Link } from "@/i18n/routing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Header } from "@/components/shared/Header";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const posts = getAllPosts(locale);

  // 예상 읽기 시간 계산
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      <main className="container mx-auto py-24 px-4 max-w-4xl">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {locale === "ko" ? "블로그" : "Blog"}
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            {locale === "ko"
              ? "SaaS 구축에 관한 인사이트와 팁을 공유합니다."
              : "Insights and tips for building your SaaS."}
          </p>
        </div>

        {/* Posts Grid */}
        <div className="space-y-8">
          {posts.map((post, index) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card
                className={`group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-zinc-400 dark:hover:border-zinc-600 ${
                  index === 0 ? "border-2" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  {index === 0 && (
                    <Badge className="w-fit mb-2" variant="secondary">
                      {locale === "ko" ? "최신 글" : "Latest"}
                    </Badge>
                  )}
                  <CardTitle className="text-xl sm:text-2xl group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                    {post.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(post.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {getReadingTime(post.content)}{" "}
                      {locale === "ko" ? "분" : "min read"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    {post.description}
                  </CardDescription>
                  <span className="inline-flex items-center text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:gap-2 transition-all">
                    {locale === "ko" ? "읽기" : "Read more"}
                    <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-zinc-500 dark:text-zinc-400">
              {locale === "ko"
                ? "아직 게시된 글이 없어요."
                : "No posts found yet."}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 text-center text-zinc-600 dark:text-zinc-400">
          <p>© 2025 SaaS Kit. Built with ❤️ for indie hackers.</p>
        </div>
      </footer>
    </div>
  );
}
