import React from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Brain,
  CheckCircle2,
  GraduationCap,
  Menu,
  PhoneCall,
  PlayCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

const programs = [
  {
    title: "Early English Foundation",
    subtitle: "Ages 5–8",
    description: "Sound-first phonics, vocabulary growth, image-led reading, and speaking confidence.",
    badge: "Most Popular",
    accent: "from-fuchsia-500 to-violet-600",
    icon: "🧠",
  },
  {
    title: "Reading & Fluency",
    subtitle: "Ages 8–12",
    description: "Build reading speed, sentence confidence, comprehension, and natural spoken English.",
    badge: "New",
    accent: "from-orange-400 to-pink-500",
    icon: "📚",
  },
  {
    title: "Speaking Power Lab",
    subtitle: "Ages 9–14",
    description: "AI-guided speaking practice, pronunciation support, and confidence-building activities.",
    badge: "AI Powered",
    accent: "from-sky-400 to-cyan-500",
    icon: "🎙️",
  },
];

const advantages = [
  {
    title: "Concept clarity through visual learning",
    description: "Every lesson is built with clear visuals, guided sound cues, and child-friendly interactions.",
    icon: Brain,
  },
  {
    title: "Personalised learning journeys",
    description: "Adaptive lessons, confidence-first practice loops, and progress paths that feel playful.",
    icon: Sparkles,
  },
  {
    title: "High-touch parent trust layer",
    description: "Parents see daily targets, confidence notes, home practice, and visible learning progress.",
    icon: ShieldCheck,
  },
];

const testimonials = [
  {
    name: "Mother of Aarav",
    meta: "Class 1 • Chennai",
    quote: "PIXO made my son actually enjoy phonics. He waits for the next lesson instead of avoiding it.",
  },
  {
    name: "Father of Sarah",
    meta: "Class 2 • Bengaluru",
    quote: "The voice practice and image-based learning helped my daughter start speaking with much more confidence.",
  },
  {
    name: "Parent of Zoya",
    meta: "Age 6 • Hyderabad",
    quote: "The best part is that the app feels gentle. No pressure, no fear, just progress.",
  },
];

const metrics = [
  { value: "30 min", label: "daily learning flow" },
  { value: "180 days", label: "structured curriculum" },
  { value: "6 parts", label: "lesson architecture" },
  { value: "AI + Parent", label: "dual support layer" },
];

const features = [
  "Emotion-safe learning experience",
  "Voice-first phonics practice",
  "Image-led vocabulary and reading",
  "Gamified rewards and streaks",
  "Parent dashboard visibility",
  "Built for Indian learners",
];

export default function Index() {
  return (
    <div
      className="min-h-screen bg-[#fcf8f4] text-[#1f1a17]"
      style={{
        fontFamily:
          "Poppins, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <header className="sticky top-0 z-50 border-b border-[#eee5da] bg-[#fcf8f4]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ff7a59] via-[#ff5ab3] to-[#6c3df4] text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">PIXO Learn</div>
              <div className="text-xs text-[#7a6e64]">AI-Powered English for Kids</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 lg:flex">
            <a className="text-sm font-medium text-[#5b514a] hover:text-[#2d2622]" href="#programs">
              Programs
            </a>
            <a className="text-sm font-medium text-[#5b514a] hover:text-[#2d2622]" href="#why-pixo">
              Why PIXO
            </a>
            <a className="text-sm font-medium text-[#5b514a] hover:text-[#2d2622]" href="#reviews">
              Reviews
            </a>
            <a className="text-sm font-medium text-[#5b514a] hover:text-[#2d2622]" href="#contact">
              Contact
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button className="rounded-full border border-[#e3d6c9] px-5 py-2.5 text-sm font-semibold text-[#5b514a] transition hover:bg-white">
              Sign In
            </button>
            <button className="rounded-full bg-[#ff7a59] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95">
              Book Free Demo
            </button>
          </div>

          <button className="grid h-11 w-11 place-items-center rounded-2xl border border-[#e6ddd4] bg-white lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[-80px] top-10 h-72 w-72 rounded-full bg-[#ffb79f]/30 blur-3xl" />
            <div className="absolute right-[-60px] top-0 h-80 w-80 rounded-full bg-[#d8c7ff]/45 blur-3xl" />
            <div className="absolute bottom-[-80px] left-1/3 h-72 w-72 rounded-full bg-[#ffe1a8]/30 blur-3xl" />
          </div>

          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-6 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#7a4df5] shadow-sm ring-1 ring-[#eee5da]">
                <BadgeCheck className="h-4 w-4" />
                Loved by ambitious parents
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-[62px]">
                Make your child
                <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff4ca0] to-[#6c3df4] bg-clip-text text-transparent">
                  fall in love with English
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-[#6b5f57] md:text-lg">
                PIXO Learn combines phonics, vocabulary, reading, and speaking into a premium learning journey built for
                kids, trusted by parents, and powered by AI.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff7a59] px-7 py-4 text-base font-semibold text-white shadow-md transition hover:brightness-95">
                  Book a Free Session
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e2d8ce] bg-white px-7 py-4 text-base font-semibold text-[#3b312c] transition hover:bg-[#fffaf6]">
                  <PlayCircle className="h-5 w-5 text-[#7a4df5]" />
                  Watch how PIXO works
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-[#efe7dd]"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#22b573]" />
                    <span className="text-sm font-medium text-[#4d433d]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10">
              <div className="grid gap-5 rounded-[32px] bg-white p-5 shadow-[0_20px_60px_rgba(71,45,24,0.08)] ring-1 ring-[#eee4da] md:p-6">
                <div className="grid gap-4 rounded-[28px] bg-gradient-to-br from-[#6c3df4] via-[#8c58ff] to-[#ff5cab] p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Free Session</div>
                    <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">1:1 Guided</div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-4">
                    <div>
                      <h2 className="text-2xl font-bold leading-tight md:text-3xl">
                        Start your child’s learning journey
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/90">
                        Book a free demo and see how PIXO teaches through visuals, voice, and confidence-first learning.
                      </p>
                    </div>

                    <div className="relative hidden min-h-[180px] w-[160px] md:block">
                      <div className="absolute right-0 top-2 grid h-24 w-24 place-items-center rounded-[28px] bg-white/20 text-5xl">
                        👧
                      </div>
                      <div className="absolute bottom-2 left-0 grid h-20 w-20 place-items-center rounded-[24px] bg-white/15 text-4xl">
                        📘
                      </div>
                      <div className="absolute bottom-10 right-3 grid h-16 w-16 place-items-center rounded-[20px] bg-white/15 text-3xl">
                        🎧
                      </div>
                    </div>
                  </div>
                </div>

                <form className="grid gap-4 rounded-[28px] bg-[#fffaf6] p-5 ring-1 ring-[#f0e7dd]">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#5a4f48]">Parent Name</label>
                    <input
                      className="w-full rounded-2xl border border-[#eadfd5] bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#7a4df5]"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#5a4f48]">Mobile Number</label>
                    <input
                      className="w-full rounded-2xl border border-[#eadfd5] bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[#7a4df5]"
                      placeholder="Enter mobile number"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5a4f48]">Child Age</label>
                      <select className="w-full rounded-2xl border border-[#eadfd5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#7a4df5]">
                        <option>Select age</option>
                        <option>5-6</option>
                        <option>7-8</option>
                        <option>9-10</option>
                        <option>11-12</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#5a4f48]">Program</label>
                      <select className="w-full rounded-2xl border border-[#eadfd5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#7a4df5]">
                        <option>Select program</option>
                        <option>Phonics Foundation</option>
                        <option>Reading & Fluency</option>
                        <option>Speaking Power Lab</option>
                      </select>
                    </div>
                  </div>

                  <button className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#ff7a59] px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:brightness-95">
                    Schedule Free Demo
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#eee4da] bg-white/70">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4 md:px-6">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-3xl bg-white px-5 py-6 text-center shadow-sm ring-1 ring-[#efe7de]"
              >
                <div className="text-2xl font-extrabold text-[#2c2420] md:text-3xl">{metric.value}</div>
                <div className="mt-2 text-sm text-[#786c63]">{metric.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="programs" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1ec] px-4 py-2 text-sm font-semibold text-[#ff7a59]">
              <BookOpen className="h-4 w-4" />
              Explore our programs
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">
              Premium learning programs for every stage
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[#6b5f57] md:text-lg">
              Structured English journeys designed for younger learners, growing readers, and confident speakers.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {programs.map((program) => (
              <div
                key={program.title}
                className="group overflow-hidden rounded-[32px] bg-white shadow-[0_20px_50px_rgba(56,38,17,0.06)] ring-1 ring-[#eee4da] transition hover:-translate-y-1"
              >
                <div className={`h-3 bg-gradient-to-r ${program.accent}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-[#fff7f2] text-3xl">
                      {program.icon}
                    </div>
                    <span className="rounded-full bg-[#f6f0ff] px-3 py-1 text-xs font-semibold text-[#7a4df5]">
                      {program.badge}
                    </span>
                  </div>

                  <div className="mt-6">
                    <div className="text-sm font-semibold text-[#7b6f66]">{program.subtitle}</div>
                    <h3 className="mt-2 text-2xl font-bold leading-tight">{program.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#6b5f57]">{program.description}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <button className="text-sm font-semibold text-[#7a4df5]">Know more</button>
                    <button className="inline-flex items-center gap-2 rounded-full bg-[#2d2622] px-4 py-2.5 text-sm font-semibold text-white">
                      Explore
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="why-pixo" className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f4efff] px-4 py-2 text-sm font-semibold text-[#7a4df5]">
                  <Star className="h-4 w-4" />
                  Get the PIXO advantage
                </div>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">
                  Learning that is clear, gentle, and sticky
                </h2>
                <p className="mt-5 text-base leading-7 text-[#6b5f57] md:text-lg">
                  The best edtech landing pages sell trust before they sell features. This section is where PIXO should
                  feel premium, credible, and parent-safe.
                </p>

                <div className="mt-8 rounded-[30px] bg-gradient-to-br from-[#6c3df4] to-[#ff5cab] p-6 text-white shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">Built for retention</div>
                      <div className="text-sm text-white/90">Not just lessons, but habit-forming learning design.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5">
                {advantages.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-4 rounded-[28px] bg-[#fcf8f4] p-6 ring-1 ring-[#eee4da]">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-[#7a4df5] shadow-sm">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold leading-tight">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#6b5f57]">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="reviews" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef8ff] px-4 py-2 text-sm font-semibold text-[#1f8ad8]">
              <Quote className="h-4 w-4" />
              Our students and parents love us
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">Real trust, real outcomes</h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[#6b5f57] md:text-lg">
              Strong edtech pages use social proof as a conversion engine. PIXO should do the same.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-[30px] bg-white p-6 shadow-[0_16px_40px_rgba(56,38,17,0.06)] ring-1 ring-[#eee4da]"
              >
                <div className="flex items-center gap-1 text-[#ffb545]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-5 text-base leading-7 text-[#403733]">“{t.quote}”</p>
                <div className="mt-6">
                  <div className="font-bold">{t.name}</div>
                  <div className="text-sm text-[#7a6e64]">{t.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
            <div className="grid gap-10 rounded-[40px] bg-gradient-to-r from-[#2d1c57] via-[#5a34d6] to-[#ff5cab] px-6 py-10 text-white md:px-10 md:py-14 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                  <GraduationCap className="h-4 w-4" />
                  Free expert counselling
                </div>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">
                  Find the right learning plan for your child
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/90 md:text-lg">
                  Speak with our academic counsellor and understand which PIXO program fits your child’s age, current
                  level, and learning goals.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-semibold text-[#4f2fd2] transition hover:bg-[#fff3fb]">
                  Book Free Counselling
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/15">
                  <PhoneCall className="h-5 w-5" />
                  Talk to Us
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer id="contact" className="border-t border-[#eee4da] bg-[#fcf8f4]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ff7a59] via-[#ff5ab3] to-[#6c3df4] text-white shadow-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold">PIXO Learn</div>
                  <div className="text-xs text-[#7a6e64]">AI-Powered English for Kids</div>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#6b5f57]">
                Premium, confidence-first English learning journeys for children, designed for habit, trust, and
                long-term outcomes.
              </p>
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-[#453c36]">Programs</div>
              <div className="mt-4 space-y-3 text-sm text-[#6b5f57]">
                <div>Phonics Foundation</div>
                <div>Reading & Fluency</div>
                <div>Speaking Power Lab</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-[#453c36]">Company</div>
              <div className="mt-4 space-y-3 text-sm text-[#6b5f57]">
                <div>About Us</div>
                <div>Parent Support</div>
                <div>Privacy Policy</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-[#453c36]">Contact</div>
              <div className="mt-4 space-y-3 text-sm text-[#6b5f57]">
                <div>support@pixolearn.com</div>
                <div>+91 00000 00000</div>
                <div>Chennai, India</div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
