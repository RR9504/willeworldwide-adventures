import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { isBookingDomain, isAdminDomain } from "@/lib/domain";
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

const ExternalRedirect = () => {
  window.location.href = 'https://willeworldwide.se';
  return null;
};

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const BookingApp = () => (
  <Routes>
    <Route path="/resa/:id" element={<TripRegistrationPage />} />
    <Route path="/resa/:id/presentation/:regId" element={<PresentationFormPage />} />
    <Route path="*" element={<ExternalRedirect />} />
  </Routes>
);

const AdminApp = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/alerts/:type" element={<AlertListPage />} />
      <Route path="/dashboard/resor/ny" element={<CreateTripPage />} />
      <Route path="/dashboard/resor/:id/redigera" element={<CreateTripPage />} />
      <Route path="/dashboard/resor/:id/deltagare/:regId" element={<ParticipantDetailPage />} />
      <Route path="/dashboard/resor/:id/presentation" element={<TripPresentationPage />} />
      <Route path="/dashboard/resor/:id" element={<TripDetailsPage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const FullApp = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/resa/:id" element={<TripRegistrationPage />} />
    <Route path="/resa/:id/presentation/:regId" element={<PresentationFormPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/alerts/:type" element={<AlertListPage />} />
      <Route path="/dashboard/resor/ny" element={<CreateTripPage />} />
      <Route path="/dashboard/resor/:id/redigera" element={<CreateTripPage />} />
      <Route path="/dashboard/resor/:id/deltagare/:regId" element={<ParticipantDetailPage />} />
      <Route path="/dashboard/resor/:id/presentation" element={<TripPresentationPage />} />
      <Route path="/dashboard/resor/:id" element={<TripDetailsPage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {isBookingDomain ? <BookingApp /> : isAdminDomain ? <AdminApp /> : <FullApp />}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
