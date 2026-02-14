import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import AppView from "./pages/AppView";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./pages/context/AuthContext"; // ✅ Ensure path is correct
import LoginModal from "./pages/LoginModal"; // ✅ Ensure path is correct

const queryClient = new QueryClient();

// ✅ This component accesses AuthContext inside AuthProvider
const AppContent = () => {
  const { isLoginModalOpen, setLoginModalOpen, setIsAuthenticated } = useAuth();

  return (
    <>
      {/* ✅ Conditionally render LoginModal*/}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setLoginModalOpen(false)}
          onLogin={(name, email, picture) => {
            setIsAuthenticated(true);
            setLoginModalOpen(false);
            console.log("User logged in:", name, email);
          }}
        />
      )}

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/app/:appId" element={<AppView />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
