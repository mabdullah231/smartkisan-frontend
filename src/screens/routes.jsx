// routes.jsx
import React, { lazy } from "react";
import {
  LayoutDashboard,
  User,
  Users,
  Settings as SettingsIcon,
  Box,
  ShoppingCart,
  CreditCard,
  FileText,
  Activity,
  Truck,
  BarChart3,
  MessageCircle,
  MessagesSquare,
  UserCircle,
  Calendar,
} from "lucide-react";

// =====================
// Admin Lazy Components
// =====================
const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./admin/pages/AdminUsers"));
const AdminSettings = lazy(() => import("./admin/pages/AdminSettings"));

// =====================
// User/Client Lazy Components
// =====================
const UserDashboard = lazy(() => import("./user/pages/UserDashboard"));
const UserSettings = lazy(() => import("./user/pages/Settings"));
const UserBot = lazy(() => import("./user/pages/UserBot"));
const UserCalendar = lazy(() => import("./user/pages/Calendar"));

export const roleBasedRoutes = {
  admin: [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
      component: AdminDashboard,
      allowedRoles: ["admin"],
    },
    {
      name: "Users",
      icon: <Users size={20} />,
      path: "/users",
      component: AdminUsers,
      allowedRoles: ["admin"],
    },
    {
      name: "Admin Hub",
      icon: <UserCircle size={20} />,
      path: "/hub",
      component: UserSettings,
      allowedRoles: ["admin"],
    },
    {
      name: "Settings",
      icon: <SettingsIcon size={20} />,
      path: "/settings",
      component: AdminSettings,
      allowedRoles: ["admin"],
      hidden: true,
    },
  ],
  user: [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
      component: UserDashboard,
      allowedRoles: ["user"],
    },
    {
      name: "Bot",
      icon: <MessagesSquare size={20} />,
      path: "/bot/:chatId?",
      component: UserBot,
      allowedRoles: ["user"],
    },
    {
      name: "Calendar",
      icon: <Calendar size={20} />,
      path: "/calendar",
      component: UserCalendar,
      allowedRoles: ["user"],
    },
    // {
    //   name: "Bot",
    //   icon: <MessagesSquare size={20} />,
    //   path: "/bot",
    //   component: UserBot,
    //   allowedRoles: ["user"],
    //   children: [
    //     {
    //       path: ":chatId",
    //       component: UserBot,
    //     }
    //   ]
    // },
    {
      name: "Profile Hub",
      icon: <UserCircle size={20} />,
      path: "/hub",
      component: UserSettings,
      allowedRoles: ["user"],
    },
    {
      name: "Settings",
      icon: <SettingsIcon size={20} />,
      path: "/settings",
      component: UserSettings,
      allowedRoles: ["user"],
      hidden: true,
    },
  ],
  client: [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
      component: UserDashboard,
      allowedRoles: ["client"],
    },
    {
      name: "Profile Hub",
      icon: <UserCircle size={20} />,
      path: "/hub",
      component: UserSettings,
      allowedRoles: ["client"],
    },
    {
      name: "Settings",
      icon: <SettingsIcon size={20} />,
      path: "/settings",
      component: UserSettings,
      allowedRoles: ["client"],
      hidden: true,
    },
  ],
};

// Define role-based route prefixes
export const ROLE_PREFIXES = {
  admin: "/admin",
  user: "/user",
};

// Helper function to get full path
export const getFullPath = (userRole, relativePath) => {
  const prefix = ROLE_PREFIXES[userRole] || "/user";
  return `${prefix}${relativePath}`;
};

// Helper function to get role from current path
export const getRoleFromPath = (pathname) => {
  const segment = pathname.split("/")[1];
  switch (segment) {
    case "admin":
      return "admin";
    case "user":
      return "user"; // Could be "user" or "client"
    default:
      return null;
  }
};

