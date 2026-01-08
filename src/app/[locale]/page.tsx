"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckIcon,
  Zap,
  Globe,
  Shield,
  Rocket,
  Star,
  Layers,
  Code2,
  Lock,
} from "lucide-react";
import { Header } from "@/components/shared/Header";
import { motion } from "framer-motion";

// Animations
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  const t = useTranslations("HomePage");
  const tFooter = useTranslations("HomePage.footer");

  const features = [
    {
      icon: Zap,
      title: t("features.fast.title"),
      description: t("features.fast.description"),
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: Globe,
      title: t("features.global.title"),
      description: t("features.global.description"),
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Shield,
      title: t("features.secure.title"),
      description: t("features.secure.description"),
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Rocket,
      title: t("features.deploy.title"),
      description: t("features.deploy.description"),
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  const testimonials = [
    {
      name: "Alex Kim",
      role: "Indie Hacker",
      avatar: "🧑‍💻",
      content: "This saved me months of work. Launched my SaaS in a weekend!",
      rating: 5,
    },
    {
      name: "Sarah Chen",
      role: "Startup Founder",
      avatar: "👩‍💼",
      content: "The best investment I made. Clean code, great documentation.",
      rating: 5,
    },
    {
      name: "Mike Johnson",
      role: "Developer",
      avatar: "👨‍🔧",
      content:
        "LemonSqueezy integration just works. No more payment headaches.",
      rating: 5,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="container mx-auto px-4 text-center max-w-5xl relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge
                className="mb-6 px-4 py-1.5 text-sm rounded-full"
                variant="secondary"
              >
                ✨ {t("badge")}
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-600 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-400 bg-clip-text text-transparent leading-tight"
            >
              {t("title")}
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              {t("description")}
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex gap-4 justify-center flex-wrap mb-20"
            >
              <Button size="lg" asChild className="text-lg px-8 h-14 shadow-xl">
                <Link href="/login">{t("pricing.getStarted")} →</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-lg px-8 h-14 bg-white/50 dark:bg-black/50 backdrop-blur-sm"
              >
                <Link href="#pricing">{t("pricing.title")}</Link>
              </Button>
            </motion.div>

            {/* Dashboard Preview / Mockup */}
            <motion.div
              variants={fadeInUp}
              className="relative mx-auto max-w-5xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 p-2 shadow-2xl backdrop-blur-sm"
            >
              <div className="aspect-[16/9] overflow-hidden rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 relative group">
                {/* Mockup UI Elements */}
                <div className="absolute inset-x-0 top-0 h-10 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center px-4 gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                  <div className="h-3 w-3 rounded-full bg-green-400/80" />
                </div>
                <div className="absolute inset-0 top-10 flex items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-900/30">
                  <p className="text-2xl font-semibold opacity-30">
                    Dashboard Preview
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Logo Cloud Section */}
      <section className="py-12 border-y border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-8">
            {t("logos.title")}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale transition-all hover:grayscale-0 hover:opacity-100">
            {/* Using text / icons as logo placeholders */}
            <div className="flex items-center gap-2 text-xl font-bold text-zinc-800 dark:text-zinc-200">
              <Layers className="h-6 w-6" /> Acme Corp
            </div>
            <div className="flex items-center gap-2 text-xl font-bold text-zinc-800 dark:text-zinc-200">
              <Zap className="h-6 w-6" /> BoltShift
            </div>
            <div className="flex items-center gap-2 text-xl font-bold text-zinc-800 dark:text-zinc-200">
              <Globe className="h-6 w-6" /> Globex
            </div>
            <div className="flex items-center gap-2 text-xl font-bold text-zinc-800 dark:text-zinc-200">
              <BoxIcon className="h-6 w-6" /> Spherix
            </div>
            <div className="flex items-center gap-2 text-xl font-bold text-zinc-800 dark:text-zinc-200">
              <CommandIcon className="h-6 w-6" /> Cmd+R
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive (Zig-Zag) */}
      <section className="py-24 bg-white dark:bg-black overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl space-y-32">
          {/* Feature 1 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold">
                {t("deepDives.one.title")}
              </h3>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t("deepDives.one.description")}
              </p>
              <ul className="space-y-3 pt-4">
                {["Next-intl built-in", "Locale Routing", "SEO Optimized"].map(
                  (item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckIcon className="h-5 w-5 text-blue-500" />
                      <span>{item}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-8 border border-blue-100 dark:border-blue-900/50">
                <div className="h-full w-full rounded-2xl bg-white dark:bg-zinc-950 shadow-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                  <span className="text-6xl">🌍</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 2 (Reversed) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row-reverse items-center gap-12"
          >
            <div className="flex-1 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold">
                {t("deepDives.two.title")}
              </h3>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t("deepDives.two.description")}
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                  <div className="font-bold mb-1">Next.js 16</div>
                  <div className="text-sm text-zinc-500">App Router Ready</div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                  <div className="font-bold mb-1">Supabase</div>
                  <div className="text-sm text-zinc-500">Database & Auth</div>
                </div>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-bl from-purple-100 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-8 border border-purple-100 dark:border-purple-900/50">
                <div className="h-full w-full rounded-2xl bg-zinc-900 shadow-xl border border-zinc-800 flex flex-col p-4">
                  <div className="flex gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="space-y-2 font-mono text-sm text-green-400">
                    <p>$ npx create-next-app@latest</p>
                    <p className="text-zinc-500">Installing dependencies...</p>
                    <p>$ npm run dev</p>
                    <p className="text-white">Ready in 2.4s 🚀</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold">
                {t("deepDives.three.title")}
              </h3>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t("deepDives.three.description")}
              </p>
              <Button variant="outline" className="mt-4">
                Read Security Patterns →
              </Button>
            </div>
            <div className="flex-1 relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-tr from-green-100 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-8 border border-green-100 dark:border-green-900/50">
                <div className="h-full w-full rounded-2xl bg-white dark:bg-zinc-950 shadow-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                  <Shield className="h-24 w-24 text-green-500" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section (Existing) */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 h-full bg-white dark:bg-zinc-900/50">
                  <CardHeader>
                    <div
                      className={`h-12 w-12 mb-2 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}
                    >
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-zinc-600 dark:text-zinc-400">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white dark:bg-black">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold mb-4">
              Loved by Developers
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="h-full bg-zinc-50 dark:bg-zinc-900 border-none">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 mb-6 leading-relaxed">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{testimonial.avatar}</span>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-zinc-500">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold mb-4">
              {t("pricing.title")}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-zinc-600 dark:text-zinc-400"
            >
              {t("pricing.subtitle")}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {/* Basic Plan */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-lg h-full bg-white dark:bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {t("pricing.basic.name")}
                  </CardTitle>
                  <CardDescription>
                    {t("pricing.basic.description")}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">
                      {t("pricing.basic.price")}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      /month
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {t
                    .raw("pricing.basic.features")
                    .map((feature: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  <Button className="w-full mt-6" variant="outline" asChild>
                    <Link href="/login">{t("pricing.getStarted")}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Plan */}
            <motion.div variants={fadeInUp}>
              <Card className="border-2 border-zinc-900 dark:border-zinc-100 relative h-full shadow-2xl bg-white dark:bg-zinc-900">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300">
                  {t("pricing.pro.popular")}
                </Badge>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {t("pricing.pro.name")}
                  </CardTitle>
                  <CardDescription>
                    {t("pricing.pro.description")}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">
                      {t("pricing.pro.price")}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      /month
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {t
                    .raw("pricing.pro.features")
                    .map((feature: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  <Button className="w-full mt-6" asChild>
                    <Link href="/login">{t("pricing.getStarted")}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white dark:bg-black">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl font-bold mb-4">
              {t("faq.title")}
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Accordion type="single" collapsible className="w-full">
              {t
                .raw("faq.questions")
                .map((faq: { q: string; a: string }, i: number) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left text-lg">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-zinc-600 dark:text-zinc-400">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black dark:from-zinc-100 dark:via-zinc-200 dark:to-white text-white dark:text-black relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 dark:bg-black/5 rounded-full blur-3xl opacity-50" />
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="container mx-auto px-4 text-center max-w-3xl relative z-10"
        >
          <motion.h2 variants={fadeInUp} className="text-5xl font-bold mb-6">
            {t("cta.title")}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl mb-10 opacity-90">
            {t("cta.description")}
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="text-lg px-10 h-16 shadow-2xl"
            >
              <Link href="/login">{t("cta.button")} →</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Expanded Footer */}
      <footer className="py-16 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                {tFooter("product")}
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:text-blue-500">
                    {tFooter("links.features")}
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-blue-500">
                    {tFooter("links.pricing")}
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="hover:text-blue-500">
                    {tFooter("links.faq")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                {tFooter("resources")}
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/blog" className="hover:text-blue-500">
                    {tFooter("links.blog")}
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-blue-500">
                    {tFooter("links.support")}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-500">
                    {tFooter("links.documentation")}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-500">
                    {tFooter("links.community")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                {tFooter("company")}
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-blue-500">
                    {tFooter("links.about")}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-500">
                    {tFooter("links.careers")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                {tFooter("legal")}
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-blue-500">
                    {tFooter("links.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-blue-500">
                    {tFooter("links.terms")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © 2025 SaaS Starter Kit. All rights reserved.
            </p>
            <div className="flex gap-4">
              {/* Social icons placeholder */}
              <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple icons for logo cloud
function BoxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22v-9" />
    </svg>
  );
}

function CommandIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
    </svg>
  );
}
