import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import WarehousePage from "./pages/Warehouse";
import Distribution from "./pages/Distribution";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import POS from "./pages/POS";
import MyInventory from "./pages/MyInventory";
import Returns from "./pages/Returns";
import More from "./pages/More";
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute requireAdmin><Products /></ProtectedRoute>} />
            <Route path="/warehouse" element={<ProtectedRoute requireAdmin><WarehousePage /></ProtectedRoute>} />
            <Route path="/distribution" element={<ProtectedRoute requireAdmin><Distribution /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute requireAdmin><Categories /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute requireAdmin><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
            <Route path="/my-inventory" element={<ProtectedRoute><MyInventory /></ProtectedRoute>} />
            <Route path="/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} />
            <Route path="/more" element={<ProtectedRoute requireAdmin><More /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
