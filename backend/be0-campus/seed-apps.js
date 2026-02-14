// Script to insert initial apps into the database
import { addApp } from './src/db.js';

async function seedApps() {
    const apps = [
        {
            id: "bus-tracking",
            name: "Bus Tracking",
            description: "Track college buses in real-time",
            url: "https://bus.vjstartup.com/",
            icon: "Bus",
            category: "Transportation",
            color: "bg-red-500",
            gradient: "from-red-500 to-red-600"
        },
        {
            id: "complaints",
            name: "Complaints",
            description: "Register complaints and grievances",
            url: "https://dev-complaints.vjstartup.com/",
            icon: "FileWarning",
            category: "Student Services",
            color: "bg-orange-500",
            gradient: "from-orange-500 to-orange-600"
        },
        {
            id: "fake-news",
            name: "Fake News Check",
            description: "Fake message verification",
            url: "https://wall.vjstartup.com/",
            icon: "Skull",
            category: "Awareness",
            color: "bg-blue-500",
            gradient: "from-blue-500 to-blue-600"
        },
        {
            id: "projects",
            name: "Projects App",
            description: "Manage Projects life cycle",
            url: "https://dev-projecthub.vjstartup.com/",
            icon: "MessageCircleQuestion",
            category: "Academic",
            color: "bg-green-500",
            gradient: "from-green-500 to-green-600"
        },
        {
            id: "open-house",
            name: "Open House",
            description: "Explore working projects through demos",
            url: "https://openhouse.vjstartup.com/",
            icon: "Award",
            category: "Showcase",
            color: "bg-purple-500",
            gradient: "from-purple-500 to-purple-600"
        },
        {
            id: "easyfind",
            name: "EasyFind",
            description: "Find your lost items here.",
            url: "https://easyfind.vjstartup.com/",
            icon: "Library",
            category: "Resources",
            color: "bg-yellow-500",
            gradient: "from-yellow-500 to-yellow-600"
        },
        {
            id: "problemhub",
            name: "ProblemHub",
            description: "Report Community Problems that you see in day to day",
            url: "https://www.vjstartup.com",
            icon: "AlertTriangle",
            category: "Innovation",
            color: "bg-red-600",
            gradient: "from-red-600 to-red-700",
            newTab: false
        },
        {
            id: "ideahub",
            name: "IdeaHub",
            description: "Ideas and Solutions that may transform society around you",
            url: "https://www.vjstartup.com/ideas",
            icon: "Lightbulb",
            category: "Innovation",
            color: "bg-yellow-500",
            gradient: "from-yellow-500 to-yellow-600",
            newTab: false
        },
        {
            id: "outpass",
            name: "Outpass",
            description: "Student pass to leave campus",
            url: "https://outpass.vjstartup.com/",
            icon: "Shield",
            category: "Student Services",
            color: "bg-blue-600",
            gradient: "from-blue-600 to-blue-700"
        },
        {
            id: "keys",
            name: "Keys",
            description: "Campus room keys handover",
            url: "https://vnr-keys.vercel.app/",
            icon: "Key",
            category: "Facilities",
            color: "bg-gray-600",
            gradient: "from-gray-600 to-gray-700",
            newTab: true
        },
        {
            id: "hostel",
            name: "Hostel",
            description: "Mention your food taking preferences",
            url: "https://hostel.vjstartup.com/",
            icon: "Home",
            category: "Student Services",
            color: "bg-pink-500",
            gradient: "from-pink-500 to-pink-600"
        }
    ];

    for (const app of apps) {
        await addApp(app);
        console.log(`Inserted: ${app.name}`);
    }
    process.exit(0);
}

seedApps();
