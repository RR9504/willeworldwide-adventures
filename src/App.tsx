import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import TripRegistrationPage from "./pages/TripRegistrationPage";
import Dashboard from "./pages/Dashboard";
import TripDetailsPage from "./pages/TripDetailsPage";
import CreateTripPage from "./pages/CreateTripPage";
import ParticipantDetailPage from "./pages/ParticipantDetailPage";
import TripPresentationPage from "./pages/TripPresentationPage";
import PresentationFormPage from "./pages/PresentationFormPage";
import AlertListPage from "./pages/AlertListPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/resa/:id" element={<TripRegistrationPage />} />
            <Route path="/resa/:id/presentation/:regId" element={<PresentationFormPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/alerts/:type" element={<ProtectedRoute><AlertListPage /></ProtectedRoute>} />
            <Route path="/dashboard/resor/ny" element={<ProtectedRoute><CreateTripPage /></ProtectedRoute>} />
            <Route path="/dashboard/resor/:id/redigera" element={<ProtectedRoute><CreateTripPage /></ProtectedRoute>} />
            <Route path="/dashboard/resor/:id/deltagare/:regId" element={<ProtectedRoute><ParticipantDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/resor/:id/presentation" element={<ProtectedRoute><TripPresentationPage /></ProtectedRoute>} />
            <Route path="/dashboard/resor/:id" element={<ProtectedRoute><TripDetailsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
