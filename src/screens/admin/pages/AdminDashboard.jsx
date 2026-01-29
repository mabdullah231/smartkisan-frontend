import React, { useContext } from "react";
import { Users, Server, MessageCircle, BarChart2 } from "lucide-react";
import Helpers from "../../../config/Helpers";
import { DarkModeContext } from "../../DashboardLayout";

const AdminDashboard = () => {
  const authUser = Helpers.getAuthUser();
  const darkMode = useContext(DarkModeContext);

  // Placeholder stats — wire to real API/models later
  const stats = [
    {
      id: "users",
      title: "Users",
      main: 234,
      active: 200,
      inactive: 34,
      icon: Users,
      subtitle: "Total users",
    },
    {
      id: "apis",
      title: "APIs",
      main: 12,
      active: 8,
      inactive: 4,
      icon: Server,
      subtitle: "Configured APIs",
    },
    {
      id: "chats",
      title: "Chats & Messages",
      chats: 120,
      messages: 452,
      icon: MessageCircle,
      subtitle: "Total chats / messages",
    },
    {
      id: "queries",
      title: "API Queries",
      main: 1023,
      icon: BarChart2,
      subtitle: "Total queries across APIs",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-200px)] pb-24">
      <p className={`transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Welcome back, {authUser?.name ?? 'Admin'}
      </p>
      <h1 className={`text-4xl font-bold mt-2 mb-5 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.id} className={`rounded-lg sm:rounded-xl md:rounded-2xl px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 flex flex-col shadow-sm hover:shadow-md transition-all duration-200 min-h-[64px] sm:min-h-[80px] md:min-h-[96px] h-auto overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className={`text-[8px] sm:text-[9px] md:text-[12px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-600'} truncate`}>{s.subtitle}</p>
                    <p className={`text-[10px] sm:text-sm md:text-base font-semibold truncate mt-0.5 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{s.title}</p>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600 sm:w-12 sm:h-12">
                    <Icon size={18} />
                  </div>
                </div>

                <div className="flex-1 flex items-end justify-between mt-1">
                  <div>
                    {s.main !== undefined && (
                      <p className={`text-lg sm:text-xl md:text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'} break-words`}>{s.main}</p>
                    )}
                    {s.chats !== undefined && (
                      <div className="space-y-0">
                        <p className={`text-lg sm:text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'} break-words`}>{s.chats}</p>
                        <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'} break-words`}>{s.messages} messages</p>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    {s.active !== undefined && (
                      <p className={`text-sm font-semibold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{s.active} active</p>
                    )}
                    {s.inactive !== undefined && (
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.inactive} inactive</p>
                    )}
                  </div>
                </div>
              </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;

