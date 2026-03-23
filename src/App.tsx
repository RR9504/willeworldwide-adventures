import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import TripRegistrationPage from "./pages/TripRegistrationPage";
import Dashboard from "./pages/Dashboard";
import TripDetailsPage from "./pages/TripDetailsPage";
import CreateTripPage from "./pages/CreateTripPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/resa/:id" element={<TripRegistrationPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/resor/ny" element={<CreateTripPage />} />
          <Route path="/dashboard/resor/:id/redigera" element={<CreateTripPage />} />
          <Route path="/dashboard/resor/:id" element={<TripDetailsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
