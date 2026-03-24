import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigate } from "react-router-dom";
import TripRegistrationPage from "./pages/TripRegistrationPage";
import Dashboard from "./pages/Dashboard";
import TripDetailsPage from "./pages/TripDetailsPage";
import CreateTripPage from "./pages/CreateTripPage";
import ParticipantDetailPage from "./pages/ParticipantDetailPage";
import TripPresentationPage from "./pages/TripPresentationPage";
import PresentationFormPage from "./pages/PresentationFormPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/resa/:id" element={<TripRegistrationPage />} />
          <Route path="/resa/:id/presentation/:regId" element={<PresentationFormPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/resor/ny" element={<CreateTripPage />} />
          <Route path="/dashboard/resor/:id/redigera" element={<CreateTripPage />} />
          <Route path="/dashboard/resor/:id/deltagare/:regId" element={<ParticipantDetailPage />} />
          <Route path="/dashboard/resor/:id/presentation" element={<TripPresentationPage />} />
          <Route path="/dashboard/resor/:id" element={<TripDetailsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
