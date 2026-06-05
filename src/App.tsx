import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { GameProvider, useGame } from "@/hooks/useGame";

import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import Career from "./pages/Career";
import NewCareer from "./pages/NewCareer";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Squad from "./pages/Squad";
import League from "./pages/League";
import Transfers from "./pages/Transfers";
import Stats from "./pages/Stats";
import MatchPage from "./pages/Match";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RequireGame({ children }: { children: React.ReactNode }) {
  const { state } = useGame();
  if (!state) return <Navigate to="/career" replace />;
  return <>{children}</>;
}

const basename = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" theme="dark" />
      <BrowserRouter basename={basename}>
        <AuthProvider>
          <GameProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/career" element={<Career />} />
              <Route path="/new-career" element={<NewCareer />} />
              <Route path="/app" element={<RequireGame><Layout /></RequireGame>}>
                <Route index element={<Dashboard />} />
                <Route path="squad" element={<Squad />} />
                <Route path="league" element={<League />} />
                <Route path="transfers" element={<Transfers />} />
                <Route path="stats" element={<Stats />} />
                <Route path="match" element={<MatchPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GameProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
