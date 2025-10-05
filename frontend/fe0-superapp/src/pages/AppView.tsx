import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogIn, ExternalLink, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./context/AuthContext.tsx";

const apps = [
  {
    id: "bus-tracking",
    name: "Bus Tracking",
    description: "Track college buses in real-time",
    url: "https://bus.vjstartup.com/"
  },
  {
    id: "complaints",
    name: "Complaints",
    description: "Register complaints and grievances",
    url: "https://complaints.vjstartup.com/"
  },
  {
    id: "fake-news",
    name: "Fake News Check",
    description: "Fake message verification",
    url: "https://wall.vjstartup.com/"
  },
  {
    id: "projects",
    name: "Projects App",
    description: "Manage Projects life cycle",
    url: "https://dev-projecthub.vjstartup.com/"
  },
  {
    id: "open-house",
    name: "Open House",
    description: "Explore working projects through demos",
    url: "https://openhouse.vjstartup.com/"
  },
  {
    id: "easyfind",
    name: "EasyFind",
    description: "Find your lost items here",
    url: "https://easyfind.vjstartup.com/"
  },
  {
    id: "student-placements",
    name: "Placements",
    description: "Help students get placements",
    url: "https://placements.vjstartup.com/"
  },
  {
    id: "doubts",
    name: "Doubts",
    description: "Ask doubts during seminars and talks",
    url: "https://undoubt-ai.vercel.app/"
  },
  {
    id: "problemhub",
    name: "ProblemHub",
    description: "Report Community Problems that you see in day to day",
    url: "https://www.vjstartup.com/problems"
  },
  {
    id: "ideahub",
    name: "IdeaHub",
    description: "Ideas and Solutions that may transform society around you",
    url: "https://www.vjstartup.com/ideas"
  },
  {
    id: "outpass",
    name: "Outpass",
    description: "Student pass to leave campus",
    url: "https://outpass.vjstartup.com/"
  },
  {
    id: "keys",
    name: "Keys",
    description: "Campus room keys handover",
    url: "https://vnr-keys.vercel.app/"
  },
  {
    id: "hostel",
    name: "Hostel",
    description: "Mention your food taking preferences",
    url: "https://hostel.vjstartup.com/"
  }
];

const AppView = () => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, login, logout } = useAuth();

  const app = apps.find(a => a.id === appId);

  if (!app) {
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

  const openInNewTab = () => {
    window.open(app.url, "_blank");
  };

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
          <div className="h-full w-full overflow-hidden">
            <iframe
              src={app.url}
              className="w-full h-full"
              title={app.name}
              frameBorder="0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppView;
