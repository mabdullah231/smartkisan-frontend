import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, MessageCircle } from "lucide-react";

const BotSidebarDropdown = ({ link, basePath, darkMode, closeSidebar, isActive }) => {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    // TEMP chats (replace with API later)
    const chats = [
        { id: "chat-1", title: "Wheat Disease" },
        { id: "chat-2", title: "Weather Advice" },
    ];
    // Open dropdown if parent is active
    useEffect(() => {
        if (isActive) setOpen(true);
        else setOpen(false); // Close if not active
    }, [isActive]);

    // Close dropdown when route changes away from any child
    useEffect(() => {
        const pathMatches = chats.some(chat => location.pathname.startsWith(`${basePath}/${chat.id}`))
            || location.pathname === `${basePath}/new`;
        if (!pathMatches) setOpen(false);
    }, [location.pathname, basePath]);
    return (
        <li className="relative space-y-1">
            {/* HEADER */}
            <div className={`w-full flex items-center justify-between space-x-3 text-sm py-2 pl-4 pr-1 rounded-l-lg transition ${isActive
                ? darkMode
                    ? "bg-green-900 text-green-400 font-medium"
                    : "bg-green-50 text-green-600 font-medium"
                : darkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
            >
                {/* Left: Bot Item (click navigates to default/new chat) */}
                <NavLink
                    to={`${basePath}/new`} // or basePath if default chat
                    onClick={closeSidebar}
                    className="flex items-center gap-3 flex-1"
                >
                    {link.icon}
                    <span>{link.name}</span>
                </NavLink>

                {/* Right: Chevron (click toggles dropdown) */}
                <button
                    onClick={() => setOpen(prev => !prev)}
                    className="p-1 flex-shrink-0"
                >
                    <ChevronDown
                        size={16}
                        className={`transition-transform ${open ? "rotate-180" : ""} ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                    />
                </button>
            </div>

            {/* CHILD LINKS */}
            {open && (
                <ul className="ml-8 space-y-1">
                    {chats.map(chat => {
                        const path = `${basePath}/${chat.id}`;
                        const active = location.pathname.startsWith(path);

                        return (
                            <li key={chat.id} className="relative">
                                <NavLink
                                    to={path}
                                    onClick={closeSidebar}
                                    className={`block text-xs px-3 py-1 rounded-md ${active
                                        ? "bg-green-100 text-green-700 font-medium"
                                        : "text-gray-500 hover:text-green-600"
                                        }`}
                                >
                                    {chat.title}
                                </NavLink>

                                {/* BORDER ON ACTIVE CHAT */}
                                {active && (
                                    <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-[3px] h-5 bg-green-600 rounded-l" />
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </li>

    );
};

export default BotSidebarDropdown;
