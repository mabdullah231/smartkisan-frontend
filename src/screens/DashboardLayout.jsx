import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon, Bell, User, ChevronDown, Settings, LogOut } from "lucide-react";
import Helpers from "../config/Helpers";
import { roleBasedRoutes, getFullPath } from "./routes";
import BotSidebarDropdown from "../components/BotSideBarDropdown";

// Create DarkMode Context
export const DarkModeContext = createContext(false);

const DashboardLayout = () => {
  const location = useLocation();
  const authUser = Helpers.getAuthUser();
  const userRole = authUser?.user_role || "user";
  const navigate = useNavigate();
  // Handle both "user" and "client" roles
  const roleKey = userRole === "client" ? "client" : userRole;
  const navigationItems = roleBasedRoutes[roleKey] || roleBasedRoutes.user;
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState("english"); // "english" or "urdu"
  const [darkMode, setDarkMode] = useState(false); // Testing mode - no localStorage
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

      const handleLogout = () => {
      Helpers.removeItem("token");
      Helpers.removeItem("user");
      Helpers.toast("success", "Logged Out Successfully");
      let logOutRoute = userRole === "user" ? "/login" : "/admin-login";
      navigate(logOutRoute);
    }
  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isUserDropdownOpen && !isNotificationOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    // Use setTimeout to avoid immediate closure
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserDropdownOpen, isNotificationOpen]);

  return (
    <>
      <style>{`
        @keyframes fadeInSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dropdown-enter {
          animation: fadeInSlideDown 0.2s ease-out;
        }
      `}</style>
      <div
        className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : ''
          }`}
        style={{
          background: darkMode ? '#111827' : 'rgba(244, 249, 253, 1)'
        }}
      >
        <div className="flex h-screen relative">
          {/* Left Side - Sidebar Card */}
          <aside
            className={`fixed lg:relative inset-y-0 left-0 z-40 lg:z-auto transition-transform duration-300 ease-in-out w-[225px] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
              }`}
          >
            <div className="h-full flex items-center justify-center p-4">
              <div className={`w-full h-[calc(100vh-2rem)] rounded-2xl py-4 pl-3 shadow-lg transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                {/* Sidebar content */}
                <div className="flex flex-col h-full">
                  {/* Logo and Close Button */}
                  <div className="mb-6 flex items-center justify-between">
                    <img src="/logo.png" alt="SmartKisan Logo" className="w-16" />
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg mr-2 transition-colors"
                    >
                      <X size={20} className="text-gray-600" />
                    </button>
                  </div>

                  {/* Navigation Items */}
                  <nav className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`
                    nav::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                    <ul className="space-y-2">
                      {/* {navigationItems
                      .filter((link) => !link.hidden)
                      .map((link, index) => {
                        const fullPath = getFullPath(userRole, link.path);
                        return (
                          <li key={index} className="relative">
                            <NavLink
                              to={fullPath}
                              onClick={() => setSidebarOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center space-x-3 text-sm py-2 pl-4 pr-1 transition relative ${
                                  isActive
                                    ? darkMode
                                      ? "bg-green-900 text-green-400 font-medium rounded-l-lg"
                                      : "bg-green-50 text-green-600 font-medium rounded-l-lg"
                                    : darkMode
                                      ? "text-gray-300 hover:bg-gray-700 rounded-lg"
                                      : "text-gray-700 hover:bg-gray-50 rounded-lg"
                                }`
                              }
                            >
                              {link.icon}
                              <span>{link.name}</span>
                            </NavLink>
                            {location.pathname === fullPath && (
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-green-600 rounded-l"></div>
                            )}
                          </li>
                        );
                      })} */}
{navigationItems
  .filter(link => !link.hidden)
  .map((link, index) => {
    const fullPath = getFullPath(userRole, link.path);
    const isParentActive = location.pathname.startsWith(fullPath);

    // 🔽 IF DROPDOWN
    if (link.children?.length) {
      return (
        <BotSidebarDropdown
          key={index}
          link={link}
          basePath={fullPath}
          darkMode={darkMode}
          isActive={isParentActive}
          closeSidebar={() => setSidebarOpen(false)}
        />
      );
    }

    // ✅ NORMAL LINK (UNCHANGED)
    return (
      <li key={index} className="relative">
        <NavLink
          to={fullPath}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center space-x-3 text-sm py-2 pl-4 pr-1 transition relative ${
              isActive
                ? darkMode
                  ? "bg-green-900 text-green-400 font-medium rounded-l-lg"
                  : "bg-green-50 text-green-600 font-medium rounded-l-lg"
                : darkMode
                  ? "text-gray-300 hover:bg-gray-700 rounded-lg"
                  : "text-gray-700 hover:bg-gray-50 rounded-lg"
            }`
          }
        >
          {link.icon}
          <span>{link.name}</span>
        </NavLink>

        {location.pathname === fullPath && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-green-600 rounded-l" />
        )}
      </li>
    );
  })}


                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Side - Main Content */}
          <div
            className={`flex-1 transition-all duration-300 ease-in-out relative lg:ml-0 transition-colors duration-300`}
            style={{
              background: darkMode ? '#111827' : 'rgba(244, 249, 253, 1)'
            }}
          >
            {/* Top Bar - Rounded with padding, no background */}
            <div className="pr-2 sm:pr-4 relative z-10" style={{ overflow: 'visible' }}>
              <div className="rounded-2xl p-2 pb-0 sm:p-4 sm:pb-0 flex items-center justify-between gap-2" style={{ overflow: 'visible' }}>
                {/* Menu Toggle Button */}
                <button
                  onClick={() => setSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 hover:bg-white rounded-lg transition-all bg-white shadow-sm flex-shrink-0"
                >
                  <Menu size={20} className="text-gray-600" />
                </button>

                {/* Right side white tabs/pills */}
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 ml-auto overflow-visible flex-shrink min-w-0 py-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <style>{`
                  .navbar-pills::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-max">
                    {/* 1. Language Selector - Hidden on mobile, shown in dropdown */}
                    <div
                      className={`hidden md:flex rounded-full font-medium px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm items-center gap-1 sm:gap-2 relative cursor-pointer select-none overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}
                      onClick={() => setLanguage(language === "english" ? "urdu" : "english")}
                    >
                      <div className="flex items-center gap-1 sm:gap-2 relative w-full">
                        {/* Sliding Background */}
                        <div
                          className="absolute top-0 bottom-0 bg-green-500 rounded-full transition-transform duration-300 ease-in-out"
                          style={{
                            width: "calc(50% - 0.125rem)",
                            left: "0.25rem",
                            transform: language === "english"
                              ? "translateX(0)"
                              : "translateX(calc(100% + 0.25rem))"
                          }}
                        />
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-colors duration-300 select-none relative z-10 ${language === "english"
                            ? "text-white"
                            : darkMode ? "text-gray-400" : "text-gray-600"
                          }`}>
                          English
                        </span>
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-colors duration-300 select-none relative z-10 ${language === "urdu"
                            ? "text-white"
                            : darkMode ? "text-gray-400" : "text-gray-600"
                          }`}>
                          اُرْدُو
                        </span>
                      </div>
                    </div>

                    {/* 2. Light/Dark Mode Toggle */}
                    <div
                      className={`rounded-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 shadow-sm font-medium flex items-center gap-1 sm:gap-2 relative cursor-pointer select-none overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}
                      onClick={() => setDarkMode(!darkMode)}
                    >
                      <div className="flex items-center gap-1 sm:gap-2 relative w-full">
                        {/* Sliding Background */}
                        <div
                          className="absolute top-0 bottom-0 bg-green-500 rounded-full transition-transform duration-300 ease-in-out"
                          style={{
                            width: "calc(50% - 0.125rem)",
                            left: "0.005rem",
                            transform: !darkMode
                              ? "translateX(0)"
                              : "translateX(calc(100% + 0.25rem))"
                          }}
                        />
                        <div className={`p-1 sm:p-1.5 rounded-full transition-colors duration-300 relative z-10 ${!darkMode
                            ? "text-white"
                            : darkMode ? "text-gray-400" : "text-gray-600"
                          }`}>
                          <Sun size={14} className="sm:w-4 sm:h-4" />
                        </div>
                        <div className={`p-1 sm:p-1.5 rounded-full transition-colors duration-300 relative z-10 ${darkMode
                            ? "text-white"
                            : darkMode ? "text-gray-400" : "text-gray-600"
                          }`}>
                          <Moon size={14} className="sm:w-4 sm:h-4" />
                        </div>
                      </div>
                    </div>

                    {/* 3. Notification Icon with Dropdown */}
                    <div className="relative z-[100]" ref={notificationRef} style={{ zIndex: 100 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationOpen(!isNotificationOpen);
                          setUserDropdownOpen(false); // Close user dropdown if open
                        }}
                        className={`rounded-full p-2 sm:p-3 shadow-sm transition-colors cursor-pointer select-none relative flex-shrink-0 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                          }`}
                      >
                        <Bell size={16} className={`sm:w-[18px] sm:h-[18px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                        {/* Notification Badge */}
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          3
                        </span>
                      </button>

                      {/* Notification Dropdown */}
                      {isNotificationOpen && (
                        <div
                          className={`absolute right-0 mt-2 w-80 sm:w-96 shadow-xl rounded-lg border overflow-hidden dropdown-enter transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}
                          style={{
                            position: 'absolute',
                            zIndex: 9999,
                            top: '100%',
                            right: 0
                          }}
                        >
                          <div className={`p-4 border-b transition-colors duration-300 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                              <h3 className={`text-lg font-semibold transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Notifications</h3>
                              <button
                                onClick={() => setNotificationOpen(false)}
                                className="text-xs text-green-600 hover:text-green-700 font-medium"
                              >
                                Mark all as read
                              </button>
                            </div>
                          </div>

                          <div className="max-h-96 overflow-y-auto">
                            {/* Notification Items */}
                            <div className={`divide-y transition-colors duration-300 ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                              {/* Notification Item 1 */}
                              <div className={`p-4 cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Water your crops</p>
                                    <p className={`text-xs mt-1 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your soil moisture is below optimal level. Water your crops now.</p>
                                    <p className={`text-xs mt-1 transition-colors duration-300 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>2 hours ago</p>
                                  </div>
                                </div>
                              </div>

                              {/* Notification Item 2 */}
                              <div className={`p-4 cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Weather Alert</p>
                                    <p className={`text-xs mt-1 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Rain expected tomorrow. Prepare your fields accordingly.</p>
                                    <p className={`text-xs mt-1 transition-colors duration-300 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>5 hours ago</p>
                                  </div>
                                </div>
                              </div>

                              {/* Notification Item 3 */}
                              <div className={`p-4 cursor-pointer transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-50'}`}>
                                <div className="flex items-start gap-3">
                                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${darkMode ? 'bg-gray-500' : 'bg-gray-300'}`}></div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Crop Rotation Reminder</p>
                                    <p className={`text-xs mt-1 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Time to rotate your crops for better yield.</p>
                                    <p className={`text-xs mt-1 transition-colors duration-300 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>1 day ago</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className={`p-3 border-t transition-colors duration-300 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                            <button
                              onClick={() => setNotificationOpen(false)}
                              className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                              View All Notifications
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. User Tab with Dropdown */}
                    <div className="relative z-[100]" ref={dropdownRef} style={{ zIndex: 100 }}>
                      <button
                        type="button"
                        onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
                        className={`rounded-full p-2 sm:p-2.5 px-3 sm:px-5 shadow-sm flex items-center gap-1.5 sm:gap-2 transition-colors select-none cursor-pointer ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                          }`}
                      >
                        <User size={14} className={`sm:w-4 sm:h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                        <span className={`text-xs sm:text-sm font-medium whitespace-nowrap hidden sm:inline ${darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                          {authUser?.name || "User"}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`sm:w-4 sm:h-4 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        />
                      </button>

                      {/* User Dropdown */}
                      {isUserDropdownOpen && (
                        <div
                          className={`absolute right-0 mt-2 w-48 sm:w-56 shadow-xl rounded-lg border overflow-hidden dropdown-enter transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}
                          style={{
                            position: 'absolute',
                            zIndex: 9999,
                            top: '100%',
                            right: 0
                          }}
                        >
                          <div className="py-2">
                            {/* Language Selector for Mobile */}
                            <div className="md:hidden px-4 py-2 border-b border-gray-200">
                              <div className="text-xs text-gray-500 mb-2 select-none">Language</div>
                              <div
                                className="flex gap-2 bg-gray-100 rounded-full p-1 cursor-pointer select-none relative overflow-hidden"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLanguage(language === "english" ? "urdu" : "english");
                                }}
                              >
                                {/* Sliding Background */}
                                <div
                                  className="absolute top-0 bottom-0 bg-green-500 rounded-full transition-transform duration-300 ease-in-out"
                                  style={{
                                    width: "calc(50% - 0.25rem)",
                                    left: "0.125rem",
                                    transform: language === "english"
                                      ? "translateX(0)"
                                      : "translateX(calc(100% + 0.25rem))"
                                  }}
                                />
                                <span className={`flex-1 px-3 py-1.5 rounded-full text-sm text-center transition-colors duration-300 select-none relative z-10 ${language === "english"
                                    ? "text-white"
                                    : "text-gray-600"
                                  }`}>
                                  English
                                </span>
                                <span className={`flex-1 px-3 py-1.5 rounded-full text-sm text-center transition-colors duration-300 select-none relative z-10 ${language === "urdu"
                                    ? "text-white"
                                    : "text-gray-600"
                                  }`}>
                                  اُرْدُو
                                </span>
                              </div>
                            </div>

                            {/* User Info */}
                            <div className={`px-4 py-2 border-b transition-colors duration-300 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <div className={`text-sm font-medium transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {authUser?.name || "User"}
                              </div>
                              <div className={`text-xs capitalize transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {userRole || "Role"}
                              </div>
                            </div>

                            {/* Settings Link */}
                            <NavLink
                              to={getFullPath(userRole, "/settings")}
                              onClick={() => setUserDropdownOpen(false)}
                              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                              <Settings size={16} /> Settings
                            </NavLink>

                            {/* Logout */}
                            <button
                              onClick={() => {
                                handleLogout();
                                setUserDropdownOpen(false);
                              }}
                              type="button"
                              className={`flex items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors duration-300 w-full text-left ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                }`}
                            >
                              <LogOut size={16} /> Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="p-2 sm:p-4">
              <div className="grid grid-cols-12">
                <div className="col-span-12">
                  <DarkModeContext.Provider value={darkMode}>
                    <Outlet />
                  </DarkModeContext.Provider>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </>
  );
};

export default DashboardLayout;
