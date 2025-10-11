import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useUser, SignIn } from "@clerk/clerk-react";

/**
 * Layout Component
 * - Handles main layout of the app
 * - Displays navigation bar, sidebar, and main content via <Outlet />
 * - Shows Clerk SignIn page if user is not authenticated
 */
const Layout = () => {
  const navigate = useNavigate();
  const [sidebar, setSidebar] = useState(false); // sidebar toggle state
  const { user } = useUser(); // current logged-in user

  return user ? (
    // Authenticated view
    <div className="flex flex-col items-start justify-start h-screen">
      {/* Navigation Bar */}
      <nav className="w-full px-8 min-h-14 flex items-center justify-between border-b border-gray-200">
        {/* Logo - click navigates to home */}
        <img
          src={assets.logo}
          alt="logo"
          onClick={() => navigate("/")}
          className="cursor-pointer w-32 sm:w-44"
        />

        {/* Mobile Sidebar Toggle */}
        {sidebar ? (
          <X
            onClick={() => setSidebar(false)}
            className="w-6 h-6 text-gray-600 sm:hidden"
          />
        ) : (
          <Menu
            onClick={() => setSidebar(true)}
            className="w-6 h-6 text-gray-600 sm:hidden"
          />
        )}
      </nav>

      {/* Main Content */}
      <div className="flex-1 w-full flex h-[calc(100vh-64px)]">
        {/* Sidebar Component */}
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />

        {/* Outlet for nested routes */}
        <div className="flex-1 bg-[#F4F7FB]">
          <Outlet />
        </div>
      </div>
    </div>
  ) : (
    // Unauthenticated view: show Clerk SignIn page
    <div className="flex items-center justify-center h-screen">
      <SignIn />
    </div>
  );
};

export default Layout;
