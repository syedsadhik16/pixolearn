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
import PIXOChat from "./pages/PIXOChat";
import AdminKnowledgeIngestion from "./pages/AdminKnowledgeIngestion";
import PaymentSuccess from "./pages/PaymentSuccess";
import Billing from "./pages/Billing";
import TrophyRoom from "./pages/TrophyRoom";
import RoleSelect from "./pages/RoleSelect";
import AccessDenied from "./pages/AccessDenied";
import { LanguageOverlay } from "./components/shared/LanguageSelector";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ProtectedRoute } from "./components/shared/ProtectedRoute";
import { PremiumRoute } from "./components/shared/PremiumRoute";

import { PIXOChatBubble } from "./components/ai/PIXOChatPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <LanguageOverlay />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/role-select" element={<RoleSelect />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="/level-selection" element={<LevelSelection />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/launch-check" element={<LaunchCheck />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/student" element={<PremiumRoute><StudentDashboard /></PremiumRoute>} />
            <Route path="/lesson/:lessonId" element={<PremiumRoute><LessonSession /></PremiumRoute>} />
            <Route path="/practice" element={<PremiumRoute><AIPractice /></PremiumRoute>} />
            <Route path="/journey" element={<PremiumRoute><Journey /></PremiumRoute>} />
            <Route path="/chat" element={<PremiumRoute><Chat /></PremiumRoute>} />
            <Route path="/live" element={<PremiumRoute><Live /></PremiumRoute>} />
            <Route path="/roleplay" element={<PremiumRoute><Roleplay /></PremiumRoute>} />
            <Route path="/dictionary" element={<PremiumRoute><Dictionary /></PremiumRoute>} />
            <Route path="/studio" element={<PremiumRoute><Studio /></PremiumRoute>} />
            <Route path="/leaderboard" element={<PremiumRoute><Leaderboard /></PremiumRoute>} />
            <Route path="/shop" element={<PremiumRoute><Shop /></PremiumRoute>} />
            <Route path="/profile" element={<PremiumRoute><Profile /></PremiumRoute>} />
            <Route path="/settings" element={<PremiumRoute><Settings /></PremiumRoute>} />
            <Route path="/weekly-report" element={<PremiumRoute><WeeklyReport /></PremiumRoute>} />
            <Route path="/creative-writing" element={<PremiumRoute><CreativeWriting /></PremiumRoute>} />
            <Route path="/pixo-chat" element={<PremiumRoute><PIXOChat /></PremiumRoute>} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/billing" element={<PremiumRoute><Billing /></PremiumRoute>} />
            <Route path="/trophy-room" element={<PremiumRoute><TrophyRoom /></PremiumRoute>} />
            <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/knowledge" element={<ProtectedRoute allowedRoles={['admin']}><AdminKnowledgeIngestion /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PIXOChatBubble />
          
        </BrowserRouter>
      </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
