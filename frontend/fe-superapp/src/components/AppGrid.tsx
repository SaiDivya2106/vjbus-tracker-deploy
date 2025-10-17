import React from 'react';
import { 
  Bus, 
  FileWarning, 
  Skull, 
  MessageCircleQuestion, 
  GraduationCap, 
  Library, 
  Newspaper, 
  Building2, 
  Award, 
  Users 
} from 'lucide-react';

interface AppItem {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  color: string;
  requiresOwnAuth?: boolean;
}

interface AppGridProps {
  onAppClick: (url: string, requiresAuth: boolean) => void;
}

const AppGrid: React.FC<AppGridProps> = ({ onAppClick }) => {
  const apps: AppItem[] = [
    {
      id: 1,
      name: "Bus Tracking",
      description: "Track college buses in real-time",
      icon: <Bus size={40} />,
      url: "https://bus.vjstartup.com/",
      color: "bg-red-500"
    },
    {
      id: 2,
      name: "Complaints",
      description: "Register complaints and grievances",
      icon: <FileWarning size={40} />,
      url: "https://thrive.vjstartup.com/",
      color: "bg-orange-500",
      requiresOwnAuth: true
    },
    {
      id: 3,
      name: "Fake News Check",
      description: "Fake message verification",
      icon: <Skull size={40} />,
      url: "https://wall.vjstartup.com/",
      color: "bg-blue-500"
    },
    {
      id: 4,
      name: "Projects App",
      description: "Manage Projects life cycle",
      icon: <MessageCircleQuestion  size={40} />,
      url: "https://projecthub.vjstartup.com/",
      color: "bg-green-500"
    },
    {
      id: 5,
      name: "Open House",
      description: "Explore working projects through demos",
      icon: <Award size={40} />,
      url: "https://openhouse.vjstartup.com/",
      color: "bg-purple-500"
    },
    {
      id: 6,
      name: "EasyFind",
      description: "Find your lost items here.",
      icon: <Library size={40} />,
      url: "https://easyfind.vjstartup.com/",
      color: "bg-yellow-500"
    },
    {
      id: 7,
      name: "Student Activity",
      description: "Generate Resume based on activity",
      icon: <Newspaper size={40} />,
      url: "https://activity.vjstartup.com/",
      color: "bg-indigo-500"
    // },
    // {
    //   id: 8,
    //   name: "Hostel Management",
    //   description: "Hostel allocation and complaints",
    //   icon: <Building2 size={40} />,
    //   url: "https://www.hostelmanagement.com/",
    //   color: "bg-pink-500"
    // },
    // {
    //   id: 9,
    //   name: "Placements",
    //   description: "Placement updates and resources",
    //   icon: <Award size={40} />,
    //   url: "https://www.linkedin.com/",
    //   color: "bg-teal-500"
    // },
    // {
    //   id: 10,
    //   name: "Alumni Network",
    //   description: "Connect with college alumni",
    //   icon: <Users size={40} />,
    //   url: "https://www.linkedin.com/school/vnrvjiet/",
    //   color: "bg-cyan-500"
    }
  ];

  const handleClick = (app: AppItem) => {
    // Trigger the onAppClick function, passing the URL and whether authentication is required
    onAppClick(app.url, app.requiresOwnAuth || false);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {apps.map((app) => (
        <div 
          key={app.id}
          onClick={() => handleClick(app)} // Trigger the onClick function
          className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
        >
          <div className={`${app.color} p-6 flex justify-center items-center text-white`}>
            {app.icon}
          </div>
          <div className="p-4 text-center">
            <h3 className="font-bold text-lg text-gray-800">{app.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{app.description}</p>
            {app.requiresOwnAuth && (
              <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full inline-block">
                Separate login required
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppGrid;
