import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import pixoLogo from "@/assets/pixo-logo.png";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  Loader2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Crown,
  PlayCircle,
  CheckCircle2,
  Rocket,
} from "lucide-react";
import { z } from "zod";
import { useTranslation } from "@/hooks/useTranslation";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
});

type UserRole = "student" | "parent";
type EntryMode = "freemium" | "premium";

const heroStats = [
  { value: "Age 5–16", label: "Designed for kids" },
  { value: "180 Days", label: "Structured path" },
  { value: "30 Min/Day", label: "Daily rhythm" },
];

const trustSignals = [
  "AI-guided English learning",
  "Confidence-first phonics journey",
  "Parent dashboard visibility",
  "Calm, game-based daily practice",
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [entryMode, setEntryMode] = useState<EntryMode>(
    searchParams.get("plan") === "premium" ? "premium" : "freemium",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accountExistsNotice, setAccountExistsNotice] = useState(searchParams.get("exists") === "true");

  const { signIn, signUp, resetPassword, user, profile, roles: userRoles, isMultiRole, activeRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (searchParams.get("exists") === "true") {
      setIsSignUp(false);
      setAccountExistsNotice(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("plan") === "premium") {
      setEntryMode("premium");
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && profile) {
      if (isMultiRole && !activeRole) {
        navigate("/role-select");
        return;
      }

      const effectiveRole = activeRole || profile.role;
      if (effectiveRole !== "student") {
        const redirectPath = effectiveRole === "admin" ? "/admin" : "/parent";
        navigate(redirectPath);
        return;
      }

      checkStudentFlowState();
    }
  }, [user, profile, userRoles, activeRole, navigate]);

  const checkStudentFlowState = async () => {
    if (!user) return;

    const entryIntent = (localStorage.getItem("pixoEntryIntent") as EntryMode | null) || entryMode;

    const { data: learnerProfile } = await supabase
      .from("learner_profiles")
      .select("onboarding_completed")
      .eq("student_id", user.id)
      .maybeSingle();

    if (!learnerProfile || !learnerProfile.onboarding_completed) {
      navigate("/onboarding");
      return;
    }

    const { data: entitlement } = await supabase
      .from("user_entitlements")
      .select("launch_check_completed, selected_level, is_paid, entitlement_status, entitlement_expiry_date")
      .eq("user_id", user.id)
      .maybeSingle();

    const hasActivePremium =
      profile?.subscription_type === "premium" ||
      (!!entitlement?.is_paid &&
        entitlement?.entitlement_status === "active" &&
        (!entitlement?.entitlement_expiry_date || new Date(entitlement.entitlement_expiry_date) > new Date()));

    if (hasActivePremium) {
      navigate("/student");
      return;
    }

    if (!entitlement || !entitlement.launch_check_completed) {
      navigate("/launch-check");
      return;
    }

    if (!entitlement.selected_level) {
      navigate("/level-selection");
      return;
    }

    if (entryIntent === "premium") {
      navigate("/pricing?intent=premium");
      return;
    }

    navigate("/pricing?intent=upgrade");
  };

  const validateForm = () => {
    try {
      if (isSignUp) {
        authSchema.parse({ email, password, fullName });
      } else if (isResetPassword) {
        z.object({ email: z.string().email() }).parse({ email });
      } else {
        authSchema.omit({ fullName: true }).parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const persistEntryIntent = () => {
    localStorage.setItem("pixoEntryIntent", entryMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setAccountExistsNotice(false);
    persistEntryIntent();

    try {
      if (isResetPassword) {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast({
          title: t("checkEmail"),
          description: t("resetLinkSent"),
        });
        setIsResetPassword(false);
      } else if (isSignUp) {
        const { error } = await signUp(email, password, fullName, selectedRole);

        if (error) {
          if (
            error.message.includes("already registered") ||
            error.message.includes("User already registered") ||
            error.message.includes("already been registered")
          ) {
            setIsSignUp(false);
            setPassword("");
            setAccountExistsNotice(true);
            toast({
              title: t("accountExists") || "Account already exists",
              description:
                t("accountExistsDesc") || "This email is already registered. Please enter your password to sign in.",
            });
            setLoading(false);
            return;
          }

          if (error.message.includes("confirm")) {
            toast({
              title: t("checkEmail") || "Check your email",
              description: "Please check your email to confirm your account before signing in.",
            });
            setLoading(false);
            return;
          }

          throw error;
        }

        toast({
          title: entryMode === "premium" ? "Account created. Premium path selected." : t("welcomeToPIXO"),
          description:
            entryMode === "premium"
              ? "Continue to onboarding, then choose a premium plan to unlock the full learning engine."
              : t("accountCreated"),
        });
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login") || error.message.includes("invalid")) {
            throw new Error(t("invalidCredentials") || "Invalid email or password. Please try again.");
          }
          if (error.message.includes("Email not confirmed")) {
            throw new Error("Please check your email and confirm your account first.");
          }
          throw error;
        }

        toast({
          title: entryMode === "premium" ? "Welcome back. Premium path selected." : t("welcomeBackGreeting"),
          description:
            entryMode === "premium"
              ? "We will guide you toward premium access after your learner setup is complete."
              : t("signedInSuccess"),
        });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("somethingWrong"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      id: "student" as UserRole,
      title: t("student"),
      description: t("iWantToLearn"),
      icon: GraduationCap,
    },
    {
      id: "parent" as UserRole,
      title: t("parent"),
      description: t("iWantToMonitor"),
      icon: Users,
    },
  ];

  const premiumBenefits = [
    "Full curriculum access",
    "Progress dashboard + reports",
    "Games, streaks, badges, XP",
    "Locked lessons unlocked",
  ];

  const freemiumBenefits = [
    "Start with onboarding",
    "Take Launch Check",
    "Explore placement flow",
    "Upgrade when ready",
  ];

  return (
    <Layout showNavbar={false}>
      <style>{`
        @keyframes drift {
          0% { transform: translate3d(0,0,0) scale(1); }
          33% { transform: translate3d(24px,-18px,0) scale(1.05); }
          66% { transform: translate3d(-18px,14px,0) scale(0.98); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes sheen {
          0% { transform: translateX(-140%) skewX(-18deg); }
          100% { transform: translateX(220%) skewX(-18deg); }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(8px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(8px) rotate(-360deg); }
        }
        .pixo-drift { animation: drift 16s ease-in-out infinite; }
        .pixo-float { animation: floaty 6s ease-in-out infinite; }
        .pixo-orbit { animation: orbit 12s linear infinite; }
        .pixo-glass {
          background: linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06));
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.35), inset 0 1px 0 rgba(255,255,255,0.18);
        }
      `}</style>

      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.18),transparent_28%),radial-gradient(circle_at_bottom_center,rgba(99,102,241,0.20),transparent_34%)]" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
            }}
          />
          <div className="pixo-drift absolute -left-16 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pixo-drift absolute right-0 top-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl [animation-delay:2s]" />
          <div className="pixo-drift absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl [animation-delay:5s]" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:flex-row lg:items-stretch lg:gap-8 lg:px-8 lg:py-8">
          <div className="relative mb-5 lg:mb-0 lg:flex lg:w-[54%]">
            <div className="pixo-glass relative flex w-full overflow-hidden rounded-[32px] border border-white/10 p-5 sm:p-6 lg:p-8">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_30%,transparent_70%,rgba(255,255,255,0.06))]" />
              <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
              <div className="absolute -right-16 top-16 h-48 w-48 rounded-full border border-white/10 bg-white/5 blur-2xl" />
              <div className="absolute -left-12 bottom-12 h-40 w-40 rounded-full border border-cyan-300/10 bg-cyan-300/10 blur-2xl" />

              <div className="relative z-10 flex w-full flex-col justify-between">
                <div>
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={pixoLogo}
                          alt="PIXO Learn"
                          className="h-12 w-12 rounded-2xl bg-white/90 p-2 shadow-2xl shadow-cyan-500/20"
                        />
                        <span className="pixo-orbit absolute inset-0">
                          <span className="absolute -right-1 top-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                        </span>
                      </div>
                      <div>
                        <div className="text-lg font-semibold tracking-tight">PIXO Learn</div>
                        <div className="text-xs text-slate-300">AI-Powered English Learning for Kids</div>
                      </div>
                    </div>
                    <div className="hidden rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-cyan-200 sm:inline-flex">
                      Freemium → Premium engine
                    </div>
                  </div>

                  <div className="max-w-2xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 py-2 text-xs font-medium text-cyan-100">
                      <Sparkles className="h-3.5 w-3.5" />
                      Glossy, premium, mobile-first access layer
                    </div>
                    <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-[3.35rem]">
                      Energy to learn.{" "}
                      <span className="bg-gradient-to-r from-cyan-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
                        Structure to grow.
                      </span>
                    </h1>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200/90 sm:text-base">
                      A glossy, high-trust entry experience for kids and parents. Start with freemium discovery, then
                      move to premium when you are ready to unlock the full PIXO learning engine.
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
                    {heroStats.map((stat) => (
                      <div
                        key={stat.value}
                        className="rounded-2xl border border-white/10 bg-white/8 p-3 shadow-xl shadow-slate-950/30 backdrop-blur-xl sm:p-4"
                      >
                        <div className="text-base font-semibold text-white sm:text-2xl">{stat.value}</div>
                        <div className="mt-1 text-[11px] text-slate-300 sm:text-sm">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="pixo-float rounded-[24px] border border-white/10 bg-gradient-to-br from-white/16 to-white/6 p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.2em] text-cyan-200">Today’s lesson</span>
                        <span className="rounded-full bg-cyan-300/12 px-2.5 py-1 text-[11px] text-cyan-100">
                          Level 1
                        </span>
                      </div>
                      <div className="text-lg font-semibold">/a/ Sound Discovery</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {["apple", "ant", "axe"].map((word) => (
                          <span
                            key={word}
                            className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-slate-100"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-white/10">
                        <div className="h-2 w-[72%] rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400" />
                      </div>
                      <div className="mt-2 text-xs text-slate-300">Confidence score growing calmly</div>
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-slate-900/35 p-4 shadow-2xl shadow-fuchsia-500/10 backdrop-blur-2xl">
                      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fuchsia-200">
                        <ShieldCheck className="h-4 w-4" />
                        Parent view
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                          <div className="text-xs text-slate-400">Confidence Note</div>
                          <div className="mt-1 text-sm text-slate-100">
                            Calm effort. Better response speed. Good engagement.
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                          <div className="text-xs text-slate-400">Home Practice</div>
                          <div className="mt-1 text-sm text-slate-100">
                            Find 3 objects that begin with the same sound.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-7">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {trustSignals.map((item, index) => (
                      <div
                        key={item}
                        className="group rounded-2xl border border-white/10 bg-white/6 p-3 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/10"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${index % 2 === 0 ? "bg-cyan-400/12 text-cyan-200" : "bg-fuchsia-400/12 text-fuchsia-200"}`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="text-sm text-slate-100">{item}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex lg:w-[46%]">
            <div className="pixo-glass relative w-full overflow-hidden rounded-[32px] border border-white/10 p-4 sm:p-6 lg:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_32%)]" />
              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

              <div className="relative z-10 mx-auto w-full max-w-md">
                <div className="mb-6 text-center lg:hidden">
                  <img
                    src={pixoLogo}
                    alt="PIXO"
                    className="mx-auto h-16 rounded-2xl bg-white/90 p-2 shadow-2xl shadow-cyan-500/20"
                  />
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-slate-100">
                    <Rocket className="h-3.5 w-3.5 text-cyan-200" />
                    {entryMode === "premium" ? "Premium path active" : "Freemium entry active"}
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight text-white">
                    {isResetPassword ? t("resetPassword") : isSignUp ? t("createAccount") : t("welcomeBack")}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {isResetPassword
                      ? t("enterResetEmail")
                      : isSignUp
                        ? "Create access and choose how you want the learning journey to begin."
                        : "Continue your child’s learning flow with a polished, guided sign-in experience."}
                  </p>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-950/35 p-2 backdrop-blur-xl">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEntryMode("freemium")}
                      className={`rounded-[18px] px-4 py-3 text-left transition ${
                        entryMode === "freemium"
                          ? "bg-white text-slate-950 shadow-xl"
                          : "bg-white/5 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <PlayCircle className="h-4 w-4" />
                        Freemium
                      </div>
                      <div className={`mt-1 text-xs ${entryMode === "freemium" ? "text-slate-700" : "text-slate-400"}`}>
                        Enter, assess, explore.
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode("premium")}
                      className={`rounded-[18px] px-4 py-3 text-left transition ${
                        entryMode === "premium"
                          ? "bg-gradient-to-br from-cyan-200 to-fuchsia-200 text-slate-950 shadow-xl"
                          : "bg-white/5 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Crown className="h-4 w-4" />
                        Premium
                      </div>
                      <div className={`mt-1 text-xs ${entryMode === "premium" ? "text-slate-700" : "text-slate-400"}`}>
                        Unlock the full engine.
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div
                    className={`rounded-[22px] border p-4 ${entryMode === "freemium" ? "border-cyan-300/25 bg-cyan-300/10" : "border-white/10 bg-white/6"}`}
                  >
                    <div className="mb-2 text-sm font-semibold text-white">Freemium flow</div>
                    <div className="space-y-2">
                      {freemiumBenefits.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-slate-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-200" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className={`rounded-[22px] border p-4 ${entryMode === "premium" ? "border-fuchsia-300/25 bg-fuchsia-300/10" : "border-white/10 bg-white/6"}`}
                  >
                    <div className="mb-2 text-sm font-semibold text-white">Premium flow</div>
                    <div className="space-y-2">
                      {premiumBenefits.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-slate-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-fuchsia-200" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {accountExistsNotice && !isSignUp && (
                  <div className="mt-5 rounded-[22px] border border-cyan-300/20 bg-cyan-300/10 p-4 text-center">
                    <p className="text-sm font-semibold text-cyan-100">
                      {t("accountExists") || "Account already exists"}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      {t("accountExistsDesc") ||
                        "This email is already registered. Please enter your password to sign in."}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  {isSignUp && !isResetPassword && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-slate-200">{t("iAmA")}</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {roleOptions.map((role) => (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => setSelectedRole(role.id)}
                              className={`rounded-[20px] border p-4 text-left transition ${
                                selectedRole === role.id
                                  ? "border-cyan-300/30 bg-cyan-300/10 shadow-xl shadow-cyan-500/10"
                                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                              }`}
                            >
                              <role.icon
                                className={`mb-3 h-7 w-7 ${selectedRole === role.id ? "text-cyan-200" : "text-slate-400"}`}
                              />
                              <div className="font-medium text-white">{role.title}</div>
                              <div className="mt-1 text-xs text-slate-400">{role.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-slate-200">
                          {t("fullName")}
                        </Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder={t("enterFullName")}
                          className={`h-12 rounded-2xl border-white/10 bg-white/8 text-white placeholder:text-slate-400 ${errors.fullName ? "border-destructive" : ""}`}
                        />
                        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">
                      {t("email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`h-12 rounded-2xl border-white/10 bg-white/8 text-white placeholder:text-slate-400 ${errors.email ? "border-destructive" : ""}`}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  {!isResetPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-200">
                        {t("password")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t("enterPassword")}
                          className={`h-12 rounded-2xl border-white/10 bg-white/8 pr-11 text-white placeholder:text-slate-400 ${errors.password ? "border-destructive" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>
                  )}

                  {!isSignUp && !isResetPassword && (
                    <button
                      type="button"
                      onClick={() => setIsResetPassword(true)}
                      className="text-sm text-cyan-200 transition hover:text-cyan-100 hover:underline"
                    >
                      {t("forgotPassword")}
                    </button>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="group relative h-12 w-full overflow-hidden rounded-2xl border border-white/15 bg-white text-sm font-semibold text-slate-950 shadow-2xl shadow-white/10 transition hover:scale-[1.01]"
                    disabled={loading}
                  >
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/0 via-white/80 to-white/0 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
                      style={{ animation: loading ? undefined : "sheen 1.8s ease-in-out infinite" }}
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isResetPassword ? (
                        t("sendResetLink")
                      ) : isSignUp ? (
                        entryMode === "premium" ? (
                          "Create Account & Continue to Premium"
                        ) : (
                          t("createAccount")
                        )
                      ) : entryMode === "premium" ? (
                        "Sign In & Continue to Premium"
                      ) : (
                        t("signIn")
                      )}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </span>
                  </Button>
                </form>

                <div className="mt-5 rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${entryMode === "premium" ? "bg-fuchsia-300/12 text-fuchsia-200" : "bg-cyan-300/12 text-cyan-200"}`}
                    >
                      {entryMode === "premium" ? <Crown className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {entryMode === "premium" ? "Premium pricing CTA logic" : "Freemium entry logic"}
                      </div>
                      <div className="mt-1 text-xs leading-6 text-slate-300">
                        {entryMode === "premium"
                          ? "After sign-in or sign-up, the system keeps your premium intent and routes unpaid learners toward pricing once onboarding, launch check, and level selection are ready."
                          : "Freemium learners can start the setup flow, explore the placement journey, and then upgrade to premium when they are ready to continue fully."}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  {isResetPassword ? (
                    <button
                      onClick={() => setIsResetPassword(false)}
                      className="text-sm text-slate-300 transition hover:text-white"
                    >
                      {t("backToSignIn")}
                    </button>
                  ) : (
                    <p className="text-sm text-slate-300">
                      {isSignUp ? t("alreadyHaveAccount") : t("dontHaveAccount")}{" "}
                      <button
                        onClick={() => {
                          setIsSignUp(!isSignUp);
                          setAccountExistsNotice(false);
                        }}
                        className="font-semibold text-cyan-200 transition hover:text-cyan-100 hover:underline"
                      >
                        {isSignUp ? t("signIn") : t("signUp")}
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
