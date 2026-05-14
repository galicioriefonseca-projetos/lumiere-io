import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { VerticalProvider } from "@/contexts/VerticalContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LicenseGate } from "@/components/LicenseGate";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { InstallPWA } from "@/components/InstallPWA";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Convite from "./pages/Convite";
import Checklists from "./pages/Checklists";
import ModoTV from "./pages/ModoTV";
import Insights from "./pages/Insights";
import Professionals from "./pages/Professionals";
import ProfessionalDetail from "./pages/ProfessionalDetail";
import Settings from "./pages/Settings";
import MasterPanel from "./pages/MasterPanel";
import Lancamentos from "./pages/Lancamentos";
import Metas from "./pages/Metas";
import Avaliar from "./pages/Avaliar";
import Avaliacoes from "./pages/Avaliacoes";
import Gamificacao from "./pages/Gamificacao";
import Categorias from "./pages/Categorias";
import Clientes from "./pages/Clientes";
import Comissoes from "./pages/Comissoes";
import TestSupabase from "./pages/TestSupabase";
import NotFound from "./pages/NotFound";
import Servicos from "./pages/Servicos";
import Agendamentos from "./pages/Agendamentos";

const queryClient = new QueryClient();

const protect = (el: JSX.Element) => (
  <ProtectedRoute>
    <InstallPWA />
    <LicenseGate>
      <OnboardingWizard />
      <TutorialOverlay />
      {el}
    </LicenseGate>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <VerticalProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/convite/:salonId" element={<Convite />} />
                <Route path="/avaliar/:salonId/:proId" element={<Avaliar />} />
                <Route path="/dashboard" element={protect(<Index />)} />
                <Route path="/lancamentos" element={protect(<Lancamentos />)} />
                <Route path="/avaliacoes" element={protect(<Avaliacoes />)} />
                <Route path="/gamificacao" element={protect(<Gamificacao />)} />
                <Route path="/metas" element={protect(<Metas />)} />
                <Route path="/categorias" element={protect(<Categorias />)} />
                <Route path="/servicos" element={protect(<Servicos />)} />
                <Route path="/agendamentos" element={protect(<Agendamentos />)} />
                <Route path="/clientes" element={protect(<Clientes />)} />
                <Route path="/comissoes" element={protect(<Comissoes />)} />
                <Route path="/test-supabase" element={protect(<TestSupabase />)} />
                <Route path="/checklists" element={protect(<Checklists />)} />
                <Route path="/profissionais" element={protect(<Professionals />)} />
                <Route path="/profissionais/:id" element={protect(<ProfessionalDetail />)} />
                <Route path="/modo-tv" element={protect(<ModoTV />)} />
                <Route path="/insights" element={protect(<Insights />)} />
                <Route path="/configuracoes" element={protect(<Settings />)} />
                <Route path="/master" element={protect(<MasterPanel />)} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </VerticalProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

