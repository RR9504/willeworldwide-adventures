import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import TripRegistrationPage from "./pages/TripRegistrationPage";
import Dashboard from "./pages/Dashboard";
import TripDetailsPage from "./pages/TripDetailsPage";
import CreateTripPage from "./pages/CreateTripPage";
import ParticipantDetailPage from "./pages/ParticipantDetailPage";
import TripPresentationPage from "./pages/TripPresentationPage";
import PresentationFormPage from "./pages/PresentationFormPage";
import RegistrationEditPage from "./pages/RegistrationEditPage";
import AlertListPage from "./pages/AlertListPage";
import ContentPagesPage from "./pages/ContentPagesPage";
import ContentEditorPage from "./pages/ContentEditorPage";
import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";
import OmOss from "./pages/OmOss";
import Kontakt from "./pages/Kontakt";
import OfferingPage from "./pages/OfferingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/om-oss" element={<OmOss />} />
          <Route path="/kontakt" element={<Kontakt />} />
          <Route path="/skidresor" element={<OfferingPage slug="skidresor" />} />
          <Route path="/gruppresor-foretagsresor" element={<OfferingPage slug="gruppresor-foretagsresor" />} />
          <Route path="/skraddarsydda-resor" element={<OfferingPage slug="skraddarsydda-resor" />} />
          <Route path="/kryssningar" element={<OfferingPage slug="kryssningar" />} />
          <Route path="/oktoberfesten-i-bremen" element={<OfferingPage slug="oktoberfesten-i-bremen" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/resa/:id" element={<TripRegistrationPage />} />
          <Route path="/resa/:id/presentation/:regId" element={<PresentationFormPage />} />
          <Route path="/resa/:id/anmalan/:regId" element={<RegistrationEditPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/innehall" element={<ContentPagesPage />} />
            <Route path="/dashboard/innehall/:slug" element={<ContentEditorPage />} />
            <Route path="/dashboard/alerts/:type" element={<AlertListPage />} />
            <Route path="/dashboard/resor/ny" element={<CreateTripPage />} />
            <Route path="/dashboard/resor/:id/redigera" element={<CreateTripPage />} />
            <Route path="/dashboard/resor/:id/deltagare/:regId" element={<ParticipantDetailPage />} />
            <Route path="/dashboard/resor/:id/presentation" element={<TripPresentationPage />} />
            <Route path="/dashboard/resor/:id" element={<TripDetailsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
