import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// removed unused Card/CardContent/Badge imports after switching to compact tiles
import { fetchUser, isAdmin as checkIsAdmin } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./index.css";
import {
  Bus,
  FileWarning,
  LogIn,
  LogOut,
  ExternalLink,
  MessageCircle,
  X,
  Send,
  Skull,
  Award,
  Library,
  AlertTriangle,
  Lightbulb,
  Shield,
  Key,
  Home,
  Pencil,
  Menu,
  User,
  Settings,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Icon } from "@radix-ui/react-select";
import { AddAppModal } from "@/components/AddAppModal";

const iconMap: Record<string, React.ElementType> = {
  Bus: Bus,
  FileWarning: FileWarning,
  LogIn: LogIn,
  LogOut: LogOut,
  ExternalLink: ExternalLink,
  MessageCircle: MessageCircle,
  X: X,
  Send: Send,
  Skull: Skull,
  Award: Award,
  Library: Library,
  AlertTriangle: AlertTriangle,
  Lightbulb: Lightbulb,
  Shield: Shield,
  Key: Key,
  Home: Home
};


// Define the App type for type safety
interface App {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  color: string;
  gradient: string;
  newTab?: boolean;
  isenabled: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Hello! How can I help you with your campus automation tools today?", isBot: true }
  ]);
  const {
    login,
    logout,
    isAuthenticated,
    isLoginModalOpen,
    setLoginModalOpen,
    setIsAuthenticated
  } = useAuth();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [animatingAppId, setAnimatingAppId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user email from cookie/localStorage (adjust as needed)
  useEffect(() => {
    fetchUser().then(user => {
      setUserEmail(user?.email || null);
      setUserName(user?.family_name || user?.name || null);
      if (user?.email) {
        checkIsAdmin().then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });
  }, [isAuthenticated]);


  // Fetch apps from backend API (object form for v5)
  const { data: apps, refetch } = useQuery<App[]>({
    queryKey: ['apps'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/apps`);
      return res.json();
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ appId, isenabled }: { appId: string; isenabled: boolean }) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/apps/${appId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isenabled }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });



  const handleToggle = (appId: string, isenabled: boolean) => {
    toggleMutation.mutate({ appId, isenabled });
  };

  // Admin: Add or Edit app
  const handleSaveApp = async (app: Partial<App>) => {
    if (editingApp) {
      await fetch(`${import.meta.env.VITE_API_URL}/apps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app)
      });
    } else {
      await fetch(`${import.meta.env.VITE_API_URL}/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app)
      });
    }
    refetch();
    setEditingApp(null);
  };

  // Admin: Delete app
  const handleDeleteApp = async (id: string) => {
    await fetch(`${import.meta.env.VITE_API_URL}/apps/${id}`, {
      method: 'DELETE',
    });
    refetch();
    setEditingApp(null);
  };

  const handleEditClick = (app: App) => {
    setEditingApp(app);
    setIsAddAppOpen(true);
  }

  const navigateToApp = (app: App) => {
    navigate(`/app/${app.id}`);
  };

  const openApp = (app: App) => {
    if (app.newTab) {
      window.open(app.url, '_blank');
      return;
    }
    if (isAnimating) return;
    setAnimatingAppId(app.id);
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setAnimatingAppId(null);
      navigateToApp(app);
    }, 500);
  };

  const [selectedAppForManagement, setSelectedAppForManagement] = useState<App | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  const handleTouchStart = (app: App) => {
    if (!isAdmin) return;
    isLongPressRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      setSelectedAppForManagement(app);
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleAppClick = (app: App, e: React.MouseEvent | React.TouchEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      return;
    }
    openApp(app);
  };

  const sendMessage = () => {
    if (!chatMessage.trim()) return;

    const newMessage = { id: Date.now(), text: chatMessage, isBot: false };
    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage("");

    // Simple bot response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: "Thanks for your message! I'm here to help you navigate your campus automation tools.",
        isBot: true
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50">
        <div className="px-3 sm:px-6 py-4 sm:py-8">
          <div className="max-w-7xl mx-auto">

            {/* TOP ROW */}
            <div className="flex items-center">

              {/* LEFT : Logo + Title */}
              <div className="flex items-center gap-3 flex-1">
                {/* Superman-style logo */}
                <div className="relative group">
                  <div className="w-14 h-14 sm:w-15 sm:h-15 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-all duration-300 border-4 border-blue-800/20">
                    <div className="absolute inset-1 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-xl shadow-inner flex items-center justify-center">
                      <div className="absolute inset-1 bg-gradient-to-br from-red-400/30 to-transparent rounded-lg"></div>
                      <span className="text-white font-black text-2xl tracking-wider relative z-10 drop-shadow-xl">
                        CL
                      </span>
                    </div>
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-white/20 rounded-full blur-sm"></div>
                  </div>

                  <div className="absolute -top-2 -right-2 hidden sm:flex w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-300 group-hover:animate-pulse">
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full"></div>
                  </div>

                  <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl group-hover:bg-blue-400/30 transition-all duration-300 -z-10"></div>
                </div>

                <div className="truncate">
                  <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 bg-clip-text text-transparent truncate">
                    Campus Life
                  </h1>
                  <p className="text-gray-600 mt-1 font-medium hidden sm:block text-sm">
                    Student Centric Campus Automation Suite
                  </p>
                </div>
              </div>

              {/* CENTER : Username (desktop only) */}
              <div className="hidden sm:flex flex-1 justify-center">
                <div className="text-center animate-fade-in font-['Poppins']">
                  <div className="text-md text-slate-500 font-medium tracking-wide">
                    Hey there 👋
                  </div>
                  {userName && (
                    <div className="text-2xl font-semibold text-indigo-600 tracking-wider">
                      {userName}
                    </div>
                  )}
                </div>
              </div>



              {/* RIGHT : Login / Logout */}
              <div className="flex-1 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/50 transition-colors">
                      <Menu className="h-6 w-6 text-gray-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl bg-white/95 backdrop-blur-xl shadow-xl border-gray-200/60 p-2">
                    <DropdownMenuLabel className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 py-1.5">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-100 my-1" />

                    {isAuthenticated && (
                      <>
                        <DropdownMenuItem
                          className="rounded-lg focus:bg-indigo-50 focus:text-indigo-700 cursor-pointer px-3 py-2.5"
                          onClick={() => navigate("/profile")}
                        >
                          <User className="mr-2 h-4 w-4" />
                          <span className="font-medium">Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-100 my-1" />
                      </>
                    )}

                    <DropdownMenuItem
                      onClick={isAuthenticated ? logout : login}
                      className={`rounded-lg cursor-pointer px-3 py-2.5 ${isAuthenticated
                        ? 'text-red-600 focus:bg-red-50 focus:text-red-700'
                        : 'text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700'
                        }`}
                    >
                      {isAuthenticated ? (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span className="font-medium">Logout</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          <span className="font-medium">Login</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* MOBILE USERNAME (below logo) */}
            <div className="sm:hidden mt-4 text-center animate-fade-in font-sans">
              <div className="text-sm text-slate-500 font-medium tracking-wide ">
                Hey there 👋
              </div>
              {userName && (
                <div className="text-lg font-bold text-indigo-600 tracking-wider">
                  {userName}
                </div>
              )}
            </div>

            {/* BOTTOM TAGLINE */}
            <div className="text-center mt-8 max-w-3xl mx-auto hidden sm:block">
              <p className="text-lg text-gray-700 leading-relaxed font-medium">
                Your unified ecosystem for student centric campus experience. Simplified Life.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="px-4 sm:px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Mobile: icons-only grid */}
          <div className="sm:hidden grid grid-cols-3 gap-4 py-2">
            {(apps ?? []).map((app, index) => {
              if (!app.isenabled && !isAdmin) return null;
              const isSelected = animatingAppId === app.id && isAnimating;
              const isOtherAnimating = isAnimating && animatingAppId !== app.id;
              const Icon = iconMap[app.icon] || ExternalLink;
              return (
                <div
                  key={app.id}
                  className="flex justify-center"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <button
                    onClick={(e) => handleAppClick(app, e)}
                    onTouchStart={() => handleTouchStart(app)}
                    onTouchEnd={handleTouchEnd}
                    onContextMenu={(e) => {
                      if (isAdmin) {
                        e.preventDefault();
                        setSelectedAppForManagement(app);
                      }
                    }}
                    aria-label={app.name}
                    title={app.name}
                    className={`group flex flex-col items-center gap-1 bg-white/0 rounded-md p-1 w-24 h-24 transition-transform duration-500 ${isSelected ? 'scale-125 z-50' : ''} ${isOtherAnimating ? 'translate-y-6 opacity-30' : ''}`}
                  >
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br ${app.gradient} relative`}>
                      <Icon className="h-6 w-6 text-black" />
                      {/* Admin Indicator Dot */}
                      {isAdmin && (
                        <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white ${app.isenabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      )}
                    </div>
                    <span className="text-[12px] text-gray-800 mt-1 text-center truncate w-full">{app.name}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop: full card grid */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(apps ?? []).map((app, index) => {
                if (!app.isenabled && !isAdmin) return null;
                const isSelected = animatingAppId === app.id && isAnimating;
                const isOtherAnimating = isAnimating && animatingAppId !== app.id;
                const Icon = iconMap[app.icon] || ExternalLink;
                return (
                  <Card
                    key={app.id}
                    className="group border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden rounded-2xl hover:bg-white/95"
                  >
                    {/* Top gradient bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${app.gradient} shadow-sm`}></div>

                    <CardContent className="p-6 relative">
                      {/* Clickable content area */}
                      <div
                        className="cursor-pointer"
                        onClick={() => navigateToApp(app)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`relative p-5 rounded-3xl bg-gradient-to-br ${app.gradient} shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 border-2 border-white/20`}>
                            <div className="absolute inset-0 bg-white/10 rounded-3xl"></div>
                            <Icon className="h-8 w-8 text-black" />
                            <div className="absolute top-2 left-2 w-4 h-2 bg-white/20 rounded-full blur-sm"></div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                              <div className={`w-2 h-2 rounded-full opacity-60 ${app.isenabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                            <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10`}></div>
                          </div>

                          <Badge
                            variant="secondary"
                            className="bg-gray-100/80 text-gray-700 border-0 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm"
                          >
                            {app.category}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-300 leading-tight">
                            {app.name}
                          </h3>
                          <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed text-sm font-medium">
                            {app.description}
                          </p>
                        </div>
                      </div>

                      {/* Admin toggle and edit */}
                      {isAdmin && (
                        <div className="mt-4 flex items-center justify-start gap-5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500"> {app.isenabled ? "Enabled" : "Disabled"}</span>
                            <Switch
                              checked={app.isenabled}
                              onCheckedChange={(checked) => handleToggle(app.id, checked)}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-green-300 hover:bg-green-500 rounded-full text-white "
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              handleEditClick(app);
                            }}
                          >
                            <Pencil className="h-4 w-4 text-black hover:text-white" strokeWidth={2.5} />
                          </Button>
                        </div>
                      )}

                      {/* External link button */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-3 group-hover:translate-y-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(app.url, app.newTab ? "_blank" : "_self");
                          }}
                          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <ExternalLink className="h-4 w-4 text-white" />
                        </button>
                      </div>

                      {/* Hover overlay (must not block clicks) */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Add App Button (bottom left) */}
      {isAdmin && (
        <div className="fixed bottom-6 left-6 z-50">
          <Button
            onClick={() => {
              setEditingApp(null);
              setIsAddAppOpen(true);
            }}
            className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center text-white text-3xl"
            title="Add App"
          >
            +
          </Button>
        </div>
      )}
      
      {isAdmin && (
        <div className="fixed bottom-6 left-0 w-full z-50 flex justify-center sm:hidden">
          <p className="text-xs text-gray-500">
            Admin! Long Press apps to edit or disable.
          </p>
        </div>
      )}


      {/* Enhanced Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <Button
            onClick={() => setIsChatOpen(true)}
            className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          >
            <MessageCircle className="h-7 w-7" />
          </Button>
        ) : (
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-3xl shadow-2xl w-80 h-96 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/60">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-800 font-bold text-sm">Campus Assistant</h3>
                  <p className="text-gray-500 text-xs font-medium">Online</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatOpen(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100/80 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-xl text-sm font-medium ${message.isBot
                      ? 'bg-gray-100/80 text-gray-800 backdrop-blur-sm'
                      : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white shadow-lg'
                      }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200/60">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-50/80 border border-gray-200/80 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 backdrop-blur-sm font-medium"
                />
                <Button
                  onClick={sendMessage}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 shadow-lg px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AddAppModal
        isOpen={isAddAppOpen}
        onClose={() => {
          setIsAddAppOpen(false);
          setEditingApp(null);
        }}
        onAdd={handleSaveApp}
        onDelete={editingApp ? handleDeleteApp : undefined}
        initialData={editingApp}
      />

      {/* Mobile Admin Management Drawer */}
      <Drawer open={!!selectedAppForManagement} onOpenChange={(open) => !open && setSelectedAppForManagement(null)}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Manage App
              </DrawerTitle>
              <DrawerDescription>Settings for {selectedAppForManagement?.name}</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-gray-900">App Status</div>
                  <div className="text-xs text-gray-500">
                    {selectedAppForManagement?.isenabled ? "Currently Enabled" : "Currently Disabled"}
                  </div>
                </div>
                {selectedAppForManagement && (
                  <Switch
                    checked={selectedAppForManagement.isenabled}
                    onCheckedChange={(checked) => {
                      // Optimistically update the local state for immediate UI feedback
                      setSelectedAppForManagement({
                        ...selectedAppForManagement,
                        isenabled: checked
                      });
                      handleToggle(selectedAppForManagement.id, checked);
                    }}
                  />
                )}
              </div>

              <Button
                onClick={() => {
                  if (selectedAppForManagement) {
                    handleEditClick(selectedAppForManagement);
                    setSelectedAppForManagement(null);
                  }
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Index;
