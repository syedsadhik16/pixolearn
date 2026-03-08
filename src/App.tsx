import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import LevelSelection from "./pages/LevelSelection";
import Onboarding from "./pages/Onboarding";
import LaunchCheck from "./pages/LaunchCheck";
import Pricing from "./pages/Pricing";
import StudentDashboard from "./pages/StudentDashboard";
import LessonSession from "./pages/LessonSession";
import AIPractice from "./pages/AIPractice";
import ParentDashboard from "./pages/ParentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Journey from "./pages/Journey";
import Chat from "./pages/Chat";
import Live from "./pages/Live";
import Roleplay from "./pages/Roleplay";
import Dictionary from "./pages/Dictionary";
import Studio from "./pages/Studio";
import Leaderboard from "./pages/Leaderboard";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import WeeklyReport from "./pages/WeeklyReport";
import CreativeWriting from "./pages/CreativeWriting";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/level-selection" element={<LevelSelection />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/launch-check" element={<LaunchCheck />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/lesson/:lessonId" element={<LessonSession />} />
            <Route path="/practice" element={<AIPractice />} />
            <Route path="/journey" element={<Journey />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/live" element={<Live />} />
            <Route path="/roleplay" element={<Roleplay />} />
            <Route path="/dictionary" element={<Dictionary />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/weekly-report" element={<WeeklyReport />} />
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
