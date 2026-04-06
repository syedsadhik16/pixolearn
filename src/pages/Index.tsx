const trustPoints = [
  "Safe for kids",
  "Parent dashboard included",
  "Daily bite-sized lessons",
  "Gamified learning journey",
  "AI-guided English practice",
];

const howItWorks = [
  {
    step: "01",
    title: "Take Launch Check",
    desc: "A quick assessment places the child at the right level without pressure or confusion.",
  },
  {
    step: "02",
    title: "Get smart level placement",
    desc: "PIXO Learn maps the learner into the right journey based on age, confidence, and readiness.",
  },
  {
    step: "03",
    title: "Learn daily with AI + games",
    desc: "Short daily sessions build phonics, speaking, reading, and confidence through structured practice.",
  },
  {
    step: "04",
    title: "Track growth and rewards",
    desc: "Parents see progress, while children unlock XP, streaks, badges, and momentum.",
  },
];

const levels = [
  {
    title: "Level 1",
    age: "Ages 5 to 8",
    desc: "Sound awareness, phonics foundation, early speaking, blending, and pre-reading confidence.",
  },
  {
    title: "Level 2",
    age: "Ages 9 to 12",
    desc: "Stronger reading fluency, vocabulary, sentence building, and real communication growth.",
  },
  {
    title: "Level 3",
    age: "Ages 13 to 16",
    desc: "Advanced comprehension, confident English usage, structured expression, and fluency development.",
  },
];

const features = [
  "Phonics-first learning",
  "Speaking practice",
  "Reading development",
  "Gamified lessons",
  "Daily XP, streaks, and badges",
  "AI-powered assistance",
  "Parent progress dashboard",
  "Multi-language support",
];

const plans = [
  {
    title: "6 Months",
    price: "₹5,999",
    highlight: false,
    desc: "Perfect to start one focused learning journey.",
    points: ["Structured daily lessons", "Launch Check", "Rewards and streaks", "Parent dashboard access"],
  },
  {
    title: "12 Months",
    price: "₹9,999",
    highlight: true,
    desc: "Best value for deeper growth and stronger consistency.",
    points: [
      "Everything in 6 Months",
      "Longer learning runway",
      "More progress visibility",
      "Better retention and confidence",
    ],
  },
  {
    title: "18 Months",
    price: "₹14,999",
    highlight: false,
    desc: "Built for full transformation across multiple learning stages.",
    points: ["Everything in 12 Months", "Long-term mastery path", "Stronger parent ROI", "Maximum compounding effect"],
  },
];

const testimonials = [
  {
    name: "Parent of a 6-year-old",
    quote:
      "My child stopped fearing English practice. The biggest shift was confidence. The lessons feel calm, fun, and structured.",
  },
  {
    name: "Parent of a 10-year-old",
    quote:
      "The daily format is simple enough to continue, and the dashboard helps us see real progress instead of guessing.",
  },
  {
    name: "Parent of a 13-year-old",
    quote: "PIXO Learn feels modern and intelligent. It is not random screen time. It feels like guided growth.",
  },
];

const faqs = [
  {
    q: "What age is PIXO Learn for?",
    a: "PIXO Learn is designed for children aged 5 to 16 through 3 structured levels.",
  },
  {
    q: "How does the assessment work?",
    a: "The Launch Check is a quick, low-pressure placement flow that identifies the right starting point for each learner.",
  },
  {
    q: "Is it beginner friendly?",
    a: "Yes. The learning path is confidence-first and adaptive, so beginners can start without feeling overwhelmed.",
  },
  {
    q: "Can parents track progress?",
    a: "Yes. Parents can view lesson progress, confidence signals, learned sounds or words, and home practice guidance.",
  },
  {
    q: "Is it mobile friendly?",
    a: "Yes. The product is designed to work smoothly across mobile, tablet, and desktop experiences.",
  },
  {
    q: "What happens after freemium access ends?",
    a: "The learner is guided to a premium plan to continue the full curriculum, progress tracking, and advanced features.",
  },
];

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
        {eyebrow}
      </div>
      <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">{desc}</p>
    </div>
  );
}

export default function Index() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute left-[-10%] top-[-10%] h-[420px] w-[420px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-[-10%] top-[10%] h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[25%] h-[380px] w-[380px] rounded-full bg-violet-500/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_35%),radial-gradient(circle_at_bottom,rgba(217,70,239,0.10),transparent_25%)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
              P
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">PIXO Learn</div>
              <div className="text-xs text-slate-400">AI-Powered English Learning for Kids</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#how" className="transition hover:text-white">
              How it works
            </a>
            <a href="#levels" className="transition hover:text-white">
              Levels
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#pricing"
              className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5 md:inline-flex"
            >
              Explore Plans
            </a>
            <a
              href="#cta"
              className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-xl shadow-white/10 transition hover:scale-[1.02]"
            >
              Start Free Assessment
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-white/5 px-4 py-2 text-xs font-medium text-cyan-200 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                Confidence-first English learning for kids
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
                AI-Powered English Learning that turns{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
                  screen time into speaking, reading, and real confidence
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                PIXO Learn helps children move from sounds to sentences through structured daily lessons, games, AI
                guidance, and parent visibility. It feels modern, safe, and built for real progress.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#cta"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                >
                  Start Free Assessment
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:border-white/25 hover:bg-white/10"
                >
                  Explore Plans
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { value: "3", label: "Structured Levels" },
                  { value: "180", label: "Days per learning path" },
                  { value: "Daily", label: "Gamified lesson rhythm" },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                    <div className="text-2xl font-semibold text-white">{item.value}</div>
                    <div className="mt-1 text-sm text-slate-400">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-12 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl" />
              <div className="absolute -right-8 bottom-12 h-24 w-24 rounded-full bg-fuchsia-400/20 blur-2xl" />

              <div className="relative rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
                <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400">Today’s Lesson</div>
                      <div className="mt-1 text-lg font-semibold">/a/ Sound Discovery</div>
                    </div>
                    <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                      Level 1
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 p-4">
                      <div className="text-sm text-slate-400">Learning Focus</div>
                      <div className="mt-2 text-xl font-semibold">Phonics + Listening</div>
                      <div className="mt-3 flex gap-2">
                        {["apple", "ant", "axe"].map((word) => (
                          <span
                            key={word}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm text-slate-400">Progress</div>
                      <div className="mt-3 h-3 rounded-full bg-white/10">
                        <div className="h-3 w-[72%] rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400" />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-slate-300">Confidence Score</span>
                        <span className="font-semibold text-white">72%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Daily XP", value: "50" },
                      { label: "Streak", value: "12 days" },
                      { label: "Badge", value: "Sound Star" },
                    ].map((card) => (
                      <div key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-slate-400">{card.label}</div>
                        <div className="mt-2 text-lg font-semibold">{card.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-3xl border border-white/10 bg-gradient-to-r from-white/5 to-white/10 p-4">
                    <div className="text-sm text-slate-400">Parent Insight</div>
                    <div className="mt-2 text-sm leading-7 text-slate-200">
                      Your child completed today’s lesson with calm effort and growing confidence.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="grid gap-4 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:grid-cols-5">
            {trustPoints.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-4 text-center text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-6 py-20">
          <SectionTitle
            eyebrow="How it works"
            title="A clean learning engine for parents and kids"
            desc="PIXO Learn removes confusion. It creates one clear path from assessment to daily progress to visible growth."
          />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {howItWorks.map((item) => (
              <div key={item.step} className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="mb-5 inline-flex rounded-2xl bg-gradient-to-br from-cyan-400/20 to-fuchsia-400/20 px-4 py-2 text-sm font-semibold text-cyan-200">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="levels" className="mx-auto max-w-7xl px-6 py-20">
          <SectionTitle
            eyebrow="Levels"
            title="Three learning levels, one clear journey"
            desc="Each level is designed around age, readiness, and confidence, so the child grows in the right sequence instead of being pushed into the wrong one."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {levels.map((level, index) => (
              <div
                key={level.title}
                className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-fuchsia-500/10" />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {index === 0 ? "Foundation" : index === 1 ? "Growth" : "Fluency"}
                  </div>
                  <h3 className="text-2xl font-semibold">{level.title}</h3>
                  <div className="mt-1 text-sm text-cyan-300">{level.age}</div>
                  <p className="mt-5 text-sm leading-7 text-slate-300">{level.desc}</p>
                  <div className="mt-6 h-1.5 rounded-full bg-white/10">
                    <div
                      className={`h-1.5 rounded-full ${
                        index === 0
                          ? "w-[35%] bg-cyan-400"
                          : index === 1
                            ? "w-[65%] bg-fuchsia-400"
                            : "w-[90%] bg-violet-400"
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20">
          <SectionTitle
            eyebrow="Features"
            title="Built like a premium product, not a random worksheet app"
            desc="The experience is designed to make learning repeatable, trackable, and rewarding, while keeping the child emotionally safe."
          />

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature}
                className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-sm text-slate-200 backdrop-blur-xl"
              >
                <div className="mb-4 h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-fuchsia-400/20" />
                <div className="font-medium">{feature}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-300">
                Parent dashboard
              </div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
                Parents get visibility without turning learning into pressure
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-300">
                PIXO Learn gives parents a clean view of progress, confidence, daily lessons, and home reinforcement. No
                chaos. No guesswork. Just signal.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Today’s target and completed lesson",
                  "Confidence note and skill visibility",
                  "Sounds or words learned",
                  "Home practice prompts",
                  "Level-wise growth tracking",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                    <div className="text-sm leading-7 text-slate-300">{item}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
              <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">Parent Overview</div>
                    <div className="mt-1 text-xl font-semibold">Learner Progress Summary</div>
                  </div>
                  <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                    Live Progress
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Today’s Target</div>
                    <div className="mt-2 text-lg font-semibold">/m/ Sound + Blend Practice</div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Confidence Note</div>
                    <div className="mt-2 text-sm leading-6 text-slate-200">
                      Calm effort with improving recognition and better response speed.
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Words Learned</div>
                    <div className="mt-2 text-lg font-semibold">moon, mango, monkey</div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Home Practice</div>
                    <div className="mt-2 text-sm leading-6 text-slate-200">
                      Say the /m/ sound slowly and find 3 words at home that begin with it.
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-400/10 to-fuchsia-500/10 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Level Progress</div>
                      <div className="mt-2 text-lg font-semibold">Level 1 - 68% Completed</div>
                    </div>
                    <div className="w-full max-w-xs rounded-full bg-white/10 md:w-64">
                      <div className="h-3 w-[68%] rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <SectionTitle
            eyebrow="Why parents choose PIXO Learn"
            title="Less passive screen time. More structured growth."
            desc="The product is designed to shift children from empty consumption into guided English development."
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Usual screen time</div>
              <div className="mt-6 space-y-4">
                {[
                  "Passive viewing",
                  "No learning structure",
                  "Low parent visibility",
                  "No confidence tracking",
                  "No skill progression logic",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-red-400/10 bg-red-400/5 px-4 py-3 text-sm text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-fuchsia-500/10 p-8 backdrop-blur-xl">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">PIXO Learn</div>
              <div className="mt-6 space-y-4">
                {[
                  "Daily active learning",
                  "Phonics to reading progression",
                  "Parent dashboard insight",
                  "Confidence-first design",
                  "Clear growth path across levels",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
          <SectionTitle
            eyebrow="Pricing"
            title="Choose the learning horizon that matches your ambition"
            desc="Short-term access creates exposure. Longer access creates compounding. That is where real confidence is built."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.title}
                className={`relative rounded-[32px] border p-8 backdrop-blur-xl ${
                  plan.highlight
                    ? "border-cyan-400/30 bg-gradient-to-br from-cyan-400/10 to-fuchsia-500/10 shadow-2xl shadow-cyan-500/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-950">
                    Most Popular
                  </div>
                )}

                <div className="text-sm uppercase tracking-[0.18em] text-slate-400">{plan.title}</div>
                <div className="mt-4 text-4xl font-semibold">{plan.price}</div>
                <p className="mt-4 text-sm leading-7 text-slate-300">{plan.desc}</p>

                <div className="mt-6 space-y-3">
                  {plan.points.map((point) => (
                    <div key={point} className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                      <div className="text-sm leading-7 text-slate-200">{point}</div>
                    </div>
                  ))}
                </div>

                <a
                  href="#cta"
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-white text-slate-950 hover:scale-[1.02]"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  Choose Plan
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <SectionTitle
            eyebrow="Testimonials"
            title="What parents feel after the product starts working"
            desc="The real signal is not just completion. It is when the child begins to approach English with less fear and more confidence."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-xl">
                <div className="text-lg leading-8 text-slate-200">“{item.quote}”</div>
                <div className="mt-6 text-sm font-medium text-cyan-300">{item.name}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-5xl px-6 py-20">
          <SectionTitle
            eyebrow="FAQ"
            title="Answers that remove buying friction"
            desc="Good landing pages do not just look premium. They dissolve uncertainty."
          />

          <div className="space-y-4">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <summary className="cursor-pointer list-none text-left text-base font-semibold text-white">
                  {item.q}
                </summary>
                <p className="mt-4 text-sm leading-7 text-slate-300">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="cta" className="mx-auto max-w-7xl px-6 py-20">
          <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-cyan-400/10 via-white/5 to-fuchsia-500/10 p-8 backdrop-blur-2xl md:p-12">
            <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />

            <div className="relative mx-auto max-w-4xl text-center">
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                Final CTA
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Help your child speak, read, and grow with confidence
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">
                Start with a freemium entry point. Upgrade to premium when you are ready to unlock the full learning
                engine.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <a
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                >
                  Start Free Assessment
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View Pricing
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">
          <div>
            <div className="text-lg font-semibold">PIXO Learn</div>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              AI-powered English learning designed to build confidence, skill, and consistent progress for children.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Product</div>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <a href="#how" className="block hover:text-white">
                How it works
              </a>
              <a href="#levels" className="block hover:text-white">
                Levels
              </a>
              <a href="#features" className="block hover:text-white">
                Features
              </a>
              <a href="#pricing" className="block hover:text-white">
                Pricing
              </a>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Company</div>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <a href="#" className="block hover:text-white">
                About
              </a>
              <a href="#" className="block hover:text-white">
                Contact
              </a>
              <a href="#" className="block hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="block hover:text-white">
                Terms of Service
              </a>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Contact</div>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <div>support@pixolearn.com</div>
              <div>India</div>
              <div>Built for parents, children, and long-term learning confidence.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
