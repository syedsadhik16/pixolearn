import React from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Globe,
  GraduationCap,
  Headphones,
  Menu,
  MessageSquareMore,
  Mic,
  PhoneCall,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Volume2,
} from "lucide-react";

const whyCards = [
  {
    title: "Speak & Practice",
    desc: "AI-powered speech evaluation gives instant feedback on pronunciation and clarity.",
    icon: Mic,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
  },
  {
    title: "Daily Lessons",
    desc: "Structured 30-minute curriculum with vocabulary, phonics, and read-aloud exercises.",
    icon: BookOpen,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-500",
  },
  {
    title: "Track Progress",
    desc: "Detailed speaking scores, streaks, and skill analytics for parents and kids.",
    icon: Trophy,
    iconBg: "bg-green-100",
    iconColor: "text-green-500",
  },
  {
    title: "Parent Monitoring",
    desc: "Parents can track their child's learning journey, weak areas, and improvements.",
    icon: UserRound,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-500",
  },
];

const steps = [
  {
    no: "1",
    title: "Take the Launch Check",
    desc: "A quick assessment finds the right level for your child",
    icon: Sparkles,
  },
  {
    no: "2",
    title: "Learn & Practice Daily",
    desc: "Fun 30-minute lessons with speech AI feedback",
    icon: Mic,
  },
  {
    no: "3",
    title: "Watch Confidence Grow",
    desc: "Track progress and celebrate milestones together",
    icon: Trophy,
  },
];

const activities = [
  { title: "Reading", time: "5 min", icon: BookOpen, color: "text-sky-500", bg: "bg-sky-100" },
  { title: "Listening", time: "5 min", icon: Headphones, color: "text-violet-500", bg: "bg-violet-100" },
  { title: "Pronunciation", time: "5 min", icon: Volume2, color: "text-orange-500", bg: "bg-orange-100" },
  { title: "Word Building", time: "5 min", icon: Brain, color: "text-green-500", bg: "bg-green-100" },
  { title: "Mini Quiz", time: "5 min", icon: CheckCircle2, color: "text-yellow-500", bg: "bg-yellow-100" },
  { title: "Fun Activity", time: "5 min", icon: PlayCircle, color: "text-rose-500", bg: "bg-rose-100" },
];

const upcomingPrograms = [
  { emoji: "🇮🇳", title: "Hindi", desc: "Learn Hindi through stories and games" },
  { emoji: "🌙", title: "Arabic", desc: "Arabic foundations for young learners" },
  { emoji: "🇫🇷", title: "French", desc: "Play-based beginner French" },
  { emoji: "💻", title: "Coding", desc: "Introduction to coding concepts" },
  { emoji: "🤖", title: "AI & Prompting", desc: "Learn to ask smart questions to AI" },
];

const featureChecklist = [
  "Unlimited practice attempts",
  "AI speech evaluation",
  "Daily lesson reminders",
  "Progress tracking",
  "Parent dashboard",
  "Attendance streaks",
];

export default function Index() {
  return (
    <div
      className="min-h-screen bg-[#f8f3ea] text-[#231f1b]"
      style={{
        fontFamily:
          "Poppins, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <header className="sticky top-0 z-50 border-b border-[#eadfce] bg-[#f8f3ea]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold tracking-tight text-[#201b16]">PIXO</div>
            <span className="hidden text-sm text-[#7c7064] sm:inline">Online</span>
          </div>

          <nav className="hidden items-center gap-8 lg:flex">
            <a href="#why-pixo" className="text-sm font-medium text-[#6b6158] transition hover:text-[#1f1a17]">
              Why PIXO
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-[#6b6158] transition hover:text-[#1f1a17]">
              How it Works
            </a>
            <a href="#features" className="text-sm font-medium text-[#6b6158] transition hover:text-[#1f1a17]">
              Features
            </a>
            <a href="#upcoming" className="text-sm font-medium text-[#6b6158] transition hover:text-[#1f1a17]">
              Upcoming
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button className="inline-flex items-center gap-2 rounded-full border border-[#e8ddcf] bg-white px-4 py-2 text-sm font-medium text-[#6a6158]">
              <Globe className="h-4 w-4" />
              🇬🇧 EN
            </button>
            <button className="px-3 py-2 text-sm font-medium text-[#3d342d]">Sign In</button>
            <button className="inline-flex items-center rounded-full bg-gradient-to-r from-[#ff7a0f] via-[#f4bd19] to-[#39c45a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95">
              Get Started
            </button>
          </div>

          <button className="grid h-10 w-10 place-items-center rounded-full border border-[#eadfce] bg-white md:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#ece2d4] bg-[linear-gradient(90deg,#f8f0e2_0%,#f5efdf_55%,#eef6e9_100%)]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-12 top-10 h-44 w-44 rounded-full bg-[#ffb36c]/20 blur-3xl" />
            <div className="absolute right-10 top-16 h-44 w-44 rounded-full bg-[#39c45a]/15 blur-3xl" />
          </div>

          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2 lg:items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff3e5] px-4 py-2 text-sm font-semibold text-[#ff7a0f] ring-1 ring-[#f5d8b8]">
                <Sparkles className="h-4 w-4" />
                AI-Powered English Learning for Kids
              </div>

              <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-tight md:text-5xl lg:text-[62px]">
                Build Your Child&apos;s
                <span className="block text-[#ff7a0f]">English Confidence</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-[#6f665e] md:text-lg">
                Structured daily lessons designed to improve pronunciation, fluency, and speaking confidence for
                children aged 5–16.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff7a0f] via-[#f4bd19] to-[#39c45a] px-7 py-4 text-base font-semibold text-white shadow-md transition hover:brightness-95">
                  Start Learning Free
                  <ArrowRight className="h-5 w-5" />
                </button>

                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e3d7c9] bg-white px-7 py-4 text-base font-semibold text-[#2f2924] transition hover:bg-[#fffaf3]">
                  View Pricing
                </button>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm text-[#8a7f73]">
                <Star className="h-4 w-4 fill-[#f4bd19] text-[#f4bd19]" />
                Helping multiple students improve their English skills every day
              </div>
            </div>

            <div className="relative z-10">
              <div className="mx-auto max-w-md rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(73,55,30,0.12)] ring-1 ring-[#eadfce]">
                <div className="flex min-h-[250px] flex-col items-center justify-center rounded-[24px] border border-[#efe4d7] bg-[#f9f7f3] p-8 text-center">
                  <div className="mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-sm ring-1 ring-[#eee2d3]">
                    <div className="text-lg font-bold tracking-wide text-[#ff7a0f]">PIXO</div>
                  </div>

                  <div className="text-2xl">🎧 📘 🧒</div>

                  <h2 className="mt-5 text-xl font-bold text-[#ff7a0f]">Energy. Learn. Grow.</h2>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-[#867a6f]">
                    Your child&apos;s journey to fluent English starts here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="why-pixo" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Why Parents Choose PIXO</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#7a7066]">
              Our interactive approach makes learning English fun and effective for children
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {whyCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-[24px] bg-white p-6 text-center shadow-sm ring-1 ring-[#ede2d4]"
                >
                  <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${card.iconBg}`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#7d7268]">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How PIXO Works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#7a7066]">
              Simple, structured learning in just 30 minutes a day
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.no} className="text-center">
                  <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#ff7a0f] via-[#f4bd19] to-[#39c45a] text-white shadow-md">
                    <Icon className="h-6 w-6" />
                    <div className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold text-[#ff7a0f] ring-1 ring-[#f0e3d6]">
                      {step.no}
                    </div>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#7a7066]">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              30 Minutes a Day,
              <span className="text-[#ff7a0f]"> 6 Fun Activities</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#7a7066]">
              Each daily lesson is broken into bite-sized learning blocks that keep kids engaged and excited
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {activities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[22px] bg-white p-5 text-center shadow-sm ring-1 ring-[#ede2d4]"
                >
                  <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${item.bg}`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="mt-4 text-sm font-semibold">{item.title}</div>
                  <div className="mt-1 text-xs text-[#8b8074]">{item.time}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 text-center text-sm text-[#8b8074]">
            🎯 Structured daily habit · 📈 Progressive difficulty · 🎮 Gamified experience
          </div>
        </section>

        <section id="features" className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1fr_420px]">
          <div>
            <h2 className="max-w-xl text-3xl font-bold tracking-tight md:text-4xl">
              Everything Your Child Needs to
              <span className="text-[#ff7a0f]"> Speak Confidently</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#7a7066]">
              PIXO provides a complete learning experience with all the tools needed to master spoken English.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {featureChecklist.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#39c45a]" />
                  <span className="text-sm text-[#514840]">{item}</span>
                </div>
              ))}
            </div>

            <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff7a0f] via-[#f4bd19] to-[#39c45a] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95">
              Start Your Free Trial
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-[#eadfce]">
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#f5f1e8] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fff1db]">
                    <Mic className="h-4 w-4 text-[#ff9f0a]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Daily Speaking Practice</div>
                    <div className="text-xs text-[#857a70]">30 min/day</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f5f1e8] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e8f6ea]">
                    <Trophy className="h-4 w-4 text-[#39c45a]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Speaking Score: 92%</div>
                    <div className="text-xs text-[#39c45a]">+12% this week</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f5f1e8] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fff1e5]">
                    <Star className="h-4 w-4 text-[#ff7a0f]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">7 Day Streak! 🔥</div>
                    <div className="text-xs text-[#857a70]">Keep it up!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="upcoming" className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff3e4] px-4 py-2 text-sm font-semibold text-[#ff7a0f]">
              <Sparkles className="h-4 w-4" />
              Expanding Soon
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">🚀 Upcoming Learning Programs</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#7a7066]">
              PIXO is growing into a complete learning ecosystem. More exciting tracks are on the way!
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {upcomingPrograms.map((program) => (
              <div key={program.title} className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-[#ede2d4]">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f7f1e8] text-lg">
                    {program.emoji}
                  </div>
                  <div className="rounded-full bg-[#f6f1e8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8a7f73]">
                    Coming Soon
                  </div>
                </div>
                <div className="mt-4 text-lg font-semibold">{program.title}</div>
                <div className="mt-2 text-sm leading-6 text-[#7a7066]">{program.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 md:px-6">
          <div className="rounded-[28px] bg-gradient-to-r from-[#ff7a0f] via-[#f4bd19] to-[#39c45a] px-6 py-14 text-center text-white shadow-[0_18px_40px_rgba(112,80,30,0.16)] md:px-12">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to Build Your Child&apos;s English Confidence?
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-white/95">
              Helping multiple students improve their English reading and speaking skills through structured daily
              learning.
            </p>
            <button className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15">
              Get Started for Free
            </button>
          </div>
        </section>

        <footer className="border-t border-[#eadfce] bg-[#f8f3ea]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-[#7a7066] md:flex-row md:px-6">
            <div className="font-semibold text-[#2b251f]">PIXO</div>
            <div>© 2026 PIXO. All rights reserved.</div>
          </div>
        </footer>
      </main>

      <button className="fixed bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-white shadow-[0_10px_25px_rgba(50,40,20,0.16)] ring-1 ring-[#eadfce]">
        <MessageSquareMore className="h-6 w-6 text-[#ff7a0f]" />
      </button>
    </div>
  );
}
