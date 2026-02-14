import { useEffect, useState } from "react";
import { fetchUser, isAdmin } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, User as UserIcon, Calendar, Shield } from "lucide-react";

interface UserData {
    email: string;
    name: string;
    picture: string;
    iat?: number;
    exp?: number;
}

const Profile = () => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await fetchUser();
                setUser(userData);
                console.log(userData.picture);

            } catch (error) {
                console.error("Failed to load user profile", error);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center p-4">
                <Card className="max-w-md w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center p-8 text-center space-y-4">
                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Not Logged In</h2>
                        <p className="text-gray-500">Please login to view your profile information.</p>
                        <Button onClick={() => navigate("/")} className="w-full bg-indigo-600 hover:bg-indigo-700">
                            Return Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="group text-gray-600 hover:text-indigo-600 hover:bg-white/50 pl-0 gap-2 transition-all"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Button>

                <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden rounded-3xl">
                    {/* Header Background */}
                    <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 relative">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    </div>

                    <CardContent className="relative px-6 sm:px-10 pb-10">
                        {/* Avatar - overlapping header */}
                        <div className="-mt-16 mb-6 flex flex-col sm:flex-row items-center sm:items-end gap-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-br from-white to-blue-100 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                <Avatar className="h-32 w-32 border-4 border-white shadow-xl relative">
                                    <AvatarImage src={user.picture} alt={user.name} referrerPolicy="no-referrer"/>
                                    <AvatarFallback className="text-4xl bg-indigo-100 text-indigo-700 font-bold">
                                        {user.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-2 right-2 h-5 w-5 bg-green-500 border-2 border-white rounded-full shadow-sm" title="Active"></div>
                            </div>
                            <div className="flex-1 flex flex-col justify-center text-center sm:text-left min-w-0">
                                <h1
                                    className={`font-bold text-gray-900 leading-tight truncate
                                    ${user.name.length > 20 ? "text-xl" : "text-3xl"}
                                    ${user.name.length > 30 ? "text-lg" : ""}
                                    `}
                                    title={user.name}
                                >
                                    {user.name}
                                </h1>
                                <p className="text-gray-500 font-medium">{isAdmin ? "Admin" : "User"}</p>
                            </div>


                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200 px-4 py-1.5 text-sm rounded-full">
                                <Shield className="w-3 h-3 mr-1.5 inline mb-0.5" />
                                Verified Account
                            </Badge>
                        </div>

                        <div className="grid gap-6 py-4">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">Contact Information</h3>

                                <div className="group flex items-center p-4 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300">
                                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                        <Mail className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-400 uppercase">Email Address</p>
                                        <p className="font-medium text-gray-900">{user.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Meta Info from Token (optional display) */}
                            {(user.iat || user.exp) && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">Session Details</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {user.iat && (
                                            <div className="flex items-center p-3 rounded-lg bg-gray-50/50">
                                                <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Issued At</p>
                                                    <p className="text-sm font-medium text-gray-700">{new Date(user.iat * 1000).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )}
                                        {user.exp && (
                                            <div className="flex items-center p-3 rounded-lg bg-gray-50/50">
                                                <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Expires At</p>
                                                    <p className="text-sm font-medium text-gray-700">{new Date(user.exp * 1000).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
