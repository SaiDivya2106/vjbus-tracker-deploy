import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogIn, ExternalLink, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "./context/AuthContext.tsx";
import { useQuery } from "@tanstack/react-query";
import { isAdmin } from "@/lib/utils.ts";

interface App {
  id: string;
  name: string;
  description: string;
  url: string;
  icon?: string;
  category?: string;
  color?: string;
  gradient?: string;
  newTab?: boolean;
  isenabled: number;
}

const AppView = () => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, login, logout } = useAuth();
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const { data: apps, isLoading, error } = useQuery<App[]>({
    queryKey: ["apps"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/apps`);
      return res.json();
    },
  });

  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const result = await isAdmin();
      setIsAdminUser(result);
      setAdminLoading(false);
    };
    checkAdmin();
  }, []);

  // Only show enabled apps to users
  const app = (apps ?? []).find(a =>
    a.id === appId && (isAdminUser || a.isenabled === 1)
  );

  const openInNewTab = () => {
    window.open(app.url, "_blank");
  };

  useEffect(() => {
    // Reset loading state when app changes
    setIframeLoading(true);
    setIframeError(null);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    // After 8s show a friendly message but keep spinner
    timeoutRef.current = window.setTimeout(() => {
      setIframeError("Still loading — opening in a moment. You can also open in a new tab.");
    }, 8000);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [appId]);


  console.log("AppView rendering for appId:", appId, "Found app:", app);
  // console.log("isAdmin:", isAdminUser);
  if (isLoading || adminLoading) {
    return <div>Loading...</div>;
  }

  if (error || !app) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-blue-100 to-indigo-100">
        <div className="text-center px-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">App Not Found</h1>
          <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  // else if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-blue-100 to-indigo-100">
  //       <div className="text-center px-4">
  //         <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-600 border-gray-200 mx-auto mb-4"></div>
  //         <h1 className="text-xl font-bold text-gray-800 mb-2">Loading App...</h1>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">{app.name}</h1>
              <p className="text-sm text-gray-600">{app.description}</p>
            </div>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              onClick={openInNewTab}
              variant="outline"
              className="bg-white/90 text-gray-700 hover:bg-gray-50 border border-gray-300 flex items-center gap-2 shadow-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>

            {isAuthenticated ? (
              <Button onClick={logout} className="text-sm px-3 py-1">
                Logout
              </Button>
            ) : (
              <Button onClick={login} className="text-sm px-3 py-1">
                <LogIn className="h-4 w-4 mr-1" />
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="mt-4 px-2 flex flex-col gap-2 sm:hidden">
            <h1 className="text-base font-semibold text-gray-800">{app.name}</h1>
            <p className="text-sm text-gray-600">{app.description}</p>
            <Button
              onClick={openInNewTab}
              variant="outline"
              className="text-gray-700 border border-gray-300 flex items-center gap-2 shadow-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
            {isAuthenticated ? (
              <Button onClick={logout} variant="outline" className="bg-white/90 text-gray-700 border border-gray-300 flex items-center gap-2 shadow-sm">
                Logout
              </Button>
            ) : (
              <Button onClick={login} variant="outline" className="bg-white/90 text-gray-700 border border-gray-300 flex items-center gap-2 shadow-sm">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Content - full-bleed iframe */}
      <div className="h-[calc(100vh-80px)]">
        <div className="h-full w-full">
          <div className="h-full w-full overflow-hidden relative">
            <iframe
              src={app.url}
              className="w-full h-full"
              title={app.name}
              style={{ border: 0 }}
              onLoad={() => {
                setIframeLoading(false);
                setIframeError(null);
                if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
              }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-modals"
            />

            {/* Loading overlay: show app name & description for better context */}
            {iframeLoading && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/60 backdrop-blur-sm transition-opacity duration-300">
                <div className="flex flex-col items-center gap-3 px-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-600 border-gray-200"></div>
                  <h2 className="text-lg font-bold text-gray-800">{app.name}</h2>
                  <p className="text-sm text-gray-600 max-w-xs text-center">{app.description}</p>
                  {iframeError && <div className="text-xs text-gray-500 mt-1">{iframeError}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppView;
