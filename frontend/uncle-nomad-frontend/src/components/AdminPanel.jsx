"use client";

import {jwtDecode} from "jwt-decode"; 
import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const AdminPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/admin-auth");
  };

  useEffect(() => {
    const authToken = localStorage.getItem("token");

    if (!authToken) {
      navigate("/admin-auth");
      return;
    }

    try {
      const decoded = jwtDecode(authToken); // Decode JWT
      const currentTime = Date.now() / 1000; // Convert to seconds

      if (decoded.exp < currentTime) {
        console.warn("Token expired, logging out...");
        handleLogout(); // Remove token and navigate
      }
    } catch (error) {
      console.error("Invalid token, logging out...");
      handleLogout();
    }

    if (location.pathname === "/admin") {
      navigate("/admin/bookings");
    }
  }, [navigate, location]);

  const navItems = [
    { path: "bookings", label: "Bookings" },
    { path: "tourbookings", label: "Tour Bookings" },
    { path: "rooms", label: "Rooms" },
    { path: "packages", label: "Packages" },
    { path: "queries", label: "Queries" },
    { path: "media", label: "Media" },
    { path: "gallery", label: "Gallery" },
    { path: "blogs", label: "Blogs" },
    { path: "Stats", label: "Stats" },
    { path: "reviews", label: "Reviews" },
    { path: "credentials", label: "Update Credentials" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="-mr-2 -my-2 md:hidden">
              <Button
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </div>
            <nav className="hidden md:flex space-x-10">
              <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-base font-medium text-gray-500 hover:text-gray-900">
                    Manage <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={() => {
                          setOpen(false); // Close dropdown before navigation
                        }}
                        className={({ isActive }) =>
                          `w-full px-4 py-2 text-sm ${
                            isActive
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700"
                          } hover:bg-gray-50`
                        }>
                        {item.label}
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
            <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white">
                <LogOut className="mr-2 h-4 w-4" /> Log Out
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMobileMenuOpen ? "block" : "hidden"} md:hidden`}>
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            <div className="mt-4 px-3">
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full justify-center">
                <LogOut className="mr-2 h-4 w-4" /> Log Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
