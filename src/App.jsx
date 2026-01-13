import React, { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import DashboardLayout from "./screens/DashboardLayout";
import Helpers from "./config/Helpers";
import { Login, Register, ForgetPassword } from "./screens";
import { roleBasedRoutes, ROLE_PREFIXES } from "./screens/routes";
import "./App.css";


// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

const Auth = ({ children, isAuth = true, allowedRoles = [] }) => {
  // COMMENTED OUT FOR DESIGN - Allow free navigation
  const location = useLocation();
  let user = null;
  let token = null;
  
  try {
    user = Helpers.getItem("user", true);
    token = Helpers.getItem("token");
  } catch (e) {
    // If parsing fails, user/token don't exist
    user = null;
    token = null;
  }

  if (isAuth) {
    // Check if user is authenticated
    if (!user || !token) {
      // Only show toast if not already on login page
      if (location.pathname !== "/") {
        Helpers.toast("error", "Please login to continue");
      }
      return <Navigate to="/" replace />;
    }
    // Check role permissions only if allowedRoles is specified and not empty
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.user_role)) {
      Helpers.toast("error", "Access denied.");
      const prefix = ROLE_PREFIXES[user.user_role] || "/user";
      return <Navigate to={`${prefix}/dashboard`} />;
    }

    // User is authenticated and has proper role access
    return children;
  } else {
    // For non-auth routes (login, register, etc.)
    if (user && token) {
      // User is already logged in, redirect to their dashboard
      const prefix = ROLE_PREFIXES[user.user_role] || "/user";
      return <Navigate to={`${prefix}/dashboard`} />;
    }
    return children;
  }
  
  // Allow all navigation for design purposes
  return children;
};

// Dynamic component wrapper
const DynamicComponent = ({ component: Component, allowedRoles }) => (
  <Auth allowedRoles={allowedRoles}>
    <Suspense fallback={<LoadingSpinner />}>
      <Component />
    </Suspense>
  </Auth>
);

function App() {
  // Generate routes dynamically based on role configuration
  const generateRoutes = () => {
    const routes = [];

    // Generate routes for each role
    Object.entries(roleBasedRoutes).forEach(([role, routeConfig]) => {
      const prefix = ROLE_PREFIXES[role];

      if (prefix) {
        routes.push(
          <Route key={role} path={prefix} element={<DashboardLayout />}>
            {routeConfig.map((route, index) => (
              <Route
                key={`${role}-${index}`}
                path={route.path.substring(1)} // Remove leading slash
                element={
                  <DynamicComponent
                    component={route.component}
                    allowedRoles={[role]}
                  />
                }
              />
            ))}
          </Route>
        );
      }
    });

    return routes;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/"
          element={
            <Auth isAuth={false}>
              <Login />
            </Auth>
          }
        />
        <Route
          path="register"
          element={
            <Auth isAuth={false}>
              <Register />
            </Auth>
          }
        />
        <Route
          path="forget-password"
          element={
            <Auth isAuth={false}>
              <ForgetPassword />
            </Auth>
          }
        />

        {/* Dynamically generated role-based routes */}
        {generateRoutes()}

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
