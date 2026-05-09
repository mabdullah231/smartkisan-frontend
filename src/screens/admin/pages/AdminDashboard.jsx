import React, { useContext, useState, useEffect } from "react";
import { Users, Server, MessageCircle, BarChart2 } from "lucide-react";
import Helpers from "../../../config/Helpers";
import { DarkModeContext } from "../../DashboardLayout";

const AdminDashboard = () => {
  const authUser = Helpers.getAuthUser();
  const darkMode = useContext(DarkModeContext);
  
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${Helpers.apiUrl}stats`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch statistics");
        }
        
        const data = await response.json();
        if (data.success) {
          setStatsData(data.stats);
        } else {
          throw new Error(data.detail || "Failed to fetch statistics");
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Build stats array from fetched data or use defaults for loading/error states
  const stats = [
    {
      id: "users",
      title: "Users",
      main: statsData ? statsData.active_users + statsData.inactive_users : 0,
      active: statsData?.active_users || 0,
      inactive: statsData?.inactive_users || 0,
      icon: Users,
      subtitle: "Total users",
    },
    {
      id: "apis",
      title: "APIs",
      main: statsData ? statsData.active_apis + statsData.inactive_apis : 0,
      active: statsData?.active_apis || 0,
      inactive: statsData?.inactive_apis || 0,
      icon: Server,
      subtitle: "Configured APIs",
    },
    {
      id: "chats",
      title: "Chats & Messages",
      chats: statsData?.total_chats || 0,
      messages: statsData?.total_messages || 0,
      icon: MessageCircle,
      subtitle: "Total chats / messages",
    },
    {
      id: "suggestions",
      title: "Suggestions Generated",
      main: statsData?.total_suggestions || 0,
      icon: BarChart2,
      subtitle: "Total suggestions generated",
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

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading statistics...</span>
        </div>
      )}

      {error && (
        <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-50 text-red-800'}`}>
          <p className="font-semibold">Error loading statistics</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
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
      )}
    </div>
  );
};

export default AdminDashboard;

