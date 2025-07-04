
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import {
  Bus,
  FileWarning,
  Skull,
  MessageCircleQuestion,
  Award,
  Library,
  Newspaper,
  ExternalLink,
  Navigation,
  FileText,
  Users,
  Settings,
  Book,
  Calendar,
  MessageCircle,
  Send,
  X,
  LogIn,
  LogOut
} from "lucide-react";
import { useAuth } from "./context/AuthContext";

import LoginModal from "./LoginModal";

interface App {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  color: string;
  gradient: string;
}

const apps: App[] = [
  {
    id: "bus-tracking",
    name: "Bus Tracking",
    description: "Track college buses in real-time",
    url: "https://bus.vjstartup.com/",
    icon: Bus,
    category: "Transportation",
    color: "bg-red-500",
    gradient: "from-red-500 to-red-600"
  },
  {
    id: "complaints",
    name: "Complaints",
    description: "Register complaints and grievances",
    url: "https://complaints.vjstartup.com/",
    icon: FileWarning,
    category: "Student Services",
    color: "bg-orange-500",
    gradient: "from-orange-500 to-orange-600"
  },
  {
    id: "fake-news",
    name: "Fake News Check",
    description: "Fake message verification",
    url: "https://wall.vjstartup.com/",
    icon: Skull,
    category: "Awareness",
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    id: "projects",
    name: "Projects App",
    description: "Manage Projects life cycle",
    url: "https://projecthub.vjstartup.com/",
    icon: MessageCircleQuestion,
    category: "Academic",
    color: "bg-green-500",
    gradient: "from-green-500 to-green-600"
  },
  {
    id: "open-house",
    name: "Open House",
    description: "Explore working projects through demos",
    url: "https://openhouse.vjstartup.com/",
    icon: Award,
    category: "Showcase",
    color: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    id: "easyfind",
    name: "EasyFind",
    description: "Find your lost items here.",
    url: "https://easyfind.vjstartup.com/",
    icon: Library,
    category: "Resources",
    color: "bg-yellow-500",
    gradient: "from-yellow-500 to-yellow-600"
  },
  {
    id: "student-activity",
    name: "Student Activity",
    description: "Generate Resume based on activity",
    url: "https://activity.vjstartup.com/",
    icon: Newspaper,
    category: "Career",
    color: "bg-indigo-500",
    gradient: "from-indigo-500 to-indigo-600"
  }
];


const Index = () => {
  const navigate = useNavigate();
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

  const openApp = (app: App) => {
    navigate(`/app/${app.id}`);
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
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              {/* Superman-style logo with shield design */}
              <div className="relative group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-all duration-300 border-4 border-blue-800/20">
                  {/* Shield shape background */}
                  <div className="absolute inset-2 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-xl shadow-inner flex items-center justify-center">
                    {/* Inner glow effect */}
                    <div className="absolute inset-1 bg-gradient-to-br from-red-400/30 to-transparent rounded-lg"></div>
                    {/* CS text with Superman styling */}
                    <span className="text-white font-black text-2xl tracking-wider relative z-10 text-shadow-lg drop-shadow-xl">CL</span>
                  </div>
                  {/* Top highlight */}
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-white/20 rounded-full blur-sm"></div>
                </div>
                {/* Floating elements around logo */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-300 group-hover:animate-pulse">
                  <div className="w-3 h-3 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full"></div>
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl group-hover:bg-blue-400/30 transition-all duration-300 -z-10"></div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                  Campus Life
                </h1>
                <p className="text-gray-600 mt-1 font-medium">Student Centric Campus Automation Suite</p>
              </div>
            </div>
            
{isAuthenticated ? (
  <Button
    onClick={logout}
    className="bg-white/90 text-gray-700 hover:bg-white hover:text-gray-800 border border-gray-300/80 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2.5 font-medium"
  >
    <LogOut className="h-4 w-4" />
    Logout
  </Button>
) : (
  <Button
    onClick={login}
    className="bg-white/90 text-gray-700 hover:bg-white hover:text-gray-800 border border-gray-300/80 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2.5 font-medium"
  >
    <LogIn className="h-4 w-4" />
    Login
  </Button>
)}

          </div>
          
          <div className="text-center mt-8 max-w-3xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed font-medium">
              Your unified ecosystem for student centric campus experience. Simplfied Life.
            </p>
          </div>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="px-4 sm:px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app, index) => (
              <Card
                key={app.id}
                className="group cursor-pointer border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 relative overflow-hidden rounded-2xl hover:bg-white/95"
                onClick={() => openApp(app)}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${app.gradient} shadow-sm`}></div>
                
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    {/* Enhanced detailed icon design */}
                    <div className={`relative p-5 rounded-3xl bg-gradient-to-br ${app.gradient} shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 border-2 border-white/20`}>
                      {/* Icon background glow */}
                      <div className="absolute inset-0 bg-white/10 rounded-3xl"></div>
                      {/* Main icon */}
                      <app.icon className="h-8 w-8 text-white relative z-10 drop-shadow-lg" />
                      {/* Inner highlight */}
                      <div className="absolute top-2 left-2 w-4 h-2 bg-white/20 rounded-full blur-sm"></div>
                      {/* Floating dot indicator */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                        <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
                      </div>
                      {/* Outer glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10`}></div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-300" />
                      <Badge 
                        variant="secondary" 
                        className="bg-gray-100/80 text-gray-700 border-0 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm hidden sm:block"
                      >
                        {app.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-300 leading-tight">
                      {app.name}
                    </h3>
                    <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed text-sm font-medium hidden sm:block">
                      {app.description}
                    </p>
                  </div>

                  {/* Enhanced hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                  
                  {/* Action indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-3 group-hover:translate-y-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                      <ExternalLink className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <Button
            onClick={() => setIsChatOpen(true)}
            className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
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
                    className={`max-w-[80%] p-3 rounded-xl text-sm font-medium ${
                      message.isBot
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
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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
    </div>
    
  );
  {isLoginModalOpen && (
  <LoginModal
    onClose={() => setLoginModalOpen(false)}
    onLogin={() => {
      setLoginModalOpen(false);
      setIsAuthenticated(true); // Trigger UI refresh
    }}
  />
)}

};

export default Index;
