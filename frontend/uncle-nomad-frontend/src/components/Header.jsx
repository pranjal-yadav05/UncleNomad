"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Image,
  Mail,
  Compass,
  Bed,
  User,
  LogIn,
  LogOut,
  FileText,
} from "lucide-react";
import LoginModal from "../modals/LoginModal";
import { ArrowRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [showProfileArrow, setShowProfileArrow] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const authToken = localStorage.getItem("authToken");
      const storedUserName = localStorage.getItem("userName");

      if (authToken) {
        // Check if the token is expired locally
        const isTokenExpired = checkTokenExpiration(authToken);

        if (isTokenExpired) {
          console.warn("Token expired, logging out.");
          handleLogout();
          return;
        }

        try {
          // Validate token with the backend
          console.log("Validating token with backend...");

          // Get API key from environment or use fallback
          const apiKey = process.env.REACT_APP_API_KEY || "";
          console.log(
            "Using API key:",
            apiKey ? "API key is set" : "API key is missing"
          );

          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/token/validate-token`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
                "x-api-key": apiKey,
              },
            }
          );

          if (response.status === 403) {
            console.warn(
              "API key validation failed. Please check your environment configuration."
            );
            // Continue with local token validation instead of logging out
            if (!checkTokenExpiration(authToken)) {
              setIsAuthenticated(true);
              setUserName(storedUserName || "");
              return;
            }
          }

          const data = await response.json();

          if (!response.ok) {
            console.warn("Token invalid, logging out:", data.message);
            handleLogout();
          } else {
            console.log("Token validated successfully");
            setIsAuthenticated(true);
            setUserName(storedUserName || "");
          }
        } catch (error) {
          console.error("Error validating token:", error);
          // On network error, still try local validation
          if (!checkTokenExpiration(authToken)) {
            console.log("Using local token validation as fallback");
            setIsAuthenticated(true);
            setUserName(storedUserName || "");
          } else {
            handleLogout(); // Logout on request failure
          }
        }
      } else {
        setIsAuthenticated(false);
        setUserName("");
      }
    };

    checkAuth(); // Run on mount

    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  // Function to check if the token is expired
  const checkTokenExpiration = (token) => {
    try {
      const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decode JWT token
      const expiryTime = decodedToken.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();

      // Check if the token has expired
      return currentTime > expiryTime;
    } catch (error) {
      console.error("Error decoding token", error);
      return true; // If token can't be decoded, consider it expired
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    setIsAuthenticated(false); // Update state
    setUserName(""); // Clear user name
    navigate("/"); // Redirect to home
  };

  // Login function
  const handleLogin = (name) => {
    setIsAuthenticated(true);
    setUserName(name);
  };

  // Check if we should show the profile arrow
  useEffect(() => {
    console.log("useEffect running, showProfileArrow:", showProfileArrow);

    const checkForNewBooking = () => {
      console.log("Checking for hasNewBooking in sessionStorage");
      const hasNewBooking = sessionStorage.getItem("hasNewBooking");
      console.log("hasNewBooking value:", hasNewBooking);
      if (hasNewBooking) {
        console.log("Setting showProfileArrow to true");
        setShowProfileArrow(true);
        console.log("showProfileArrow set to true");

        // Open mobile menu if on mobile
        if (window.innerWidth < 768) {
          // 768px is the md breakpoint
          console.log("Opening mobile menu");
          setIsMenuOpen(true);
        }

        // Only remove the flag after the tooltip has been shown for 5 seconds
        setTimeout(() => {
          console.log("Hiding profile arrow after timeout");
          setShowProfileArrow(false);
          console.log("showProfileArrow set to false");
          // Remove the flag after the tooltip is hidden
          sessionStorage.removeItem("hasNewBooking");
          console.log("hasNewBooking flag removed from sessionStorage");
        }, 5000); // Reduced from 10000 to 5000
      }
    };

    // Check immediately
    checkForNewBooking();

    // Set up an interval to check every 100ms for the first 2 seconds
    const intervalId = setInterval(checkForNewBooking, 100);

    // Clear the interval after 2 seconds
    setTimeout(() => {
      clearInterval(intervalId);
      console.log("Interval cleared");
    }, 2000);

    // Listen for storage events
    const handleStorageChange = (e) => {
      if (e.key === "hasNewBooking" && e.newValue === "true") {
        console.log("Storage event detected - hasNewBooking set to true");
        setShowProfileArrow(true);
        console.log("showProfileArrow set to true from storage event");

        // Open mobile menu if on mobile
        if (window.innerWidth < 768) {
          // 768px is the md breakpoint
          console.log("Opening mobile menu from storage event");
          setIsMenuOpen(true);
        }

        // Only remove the flag after the tooltip has been shown for 5 seconds
        setTimeout(() => {
          console.log("Hiding profile arrow after timeout from storage event");
          setShowProfileArrow(false);
          console.log("showProfileArrow set to false from storage event");
          // Remove the flag after the tooltip is hidden
          sessionStorage.removeItem("hasNewBooking");
          console.log(
            "hasNewBooking flag removed from sessionStorage from storage event"
          );
        }, 5000); // Reduced from 10000 to 5000
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("storage", handleStorageChange);
      console.log("useEffect cleanup");
    };
  }, [location.pathname, showProfileArrow]); // Added showProfileArrow to dependencies

  // Handle profile click
  const handleProfileClick = () => {
    setShowProfileArrow(false);
    sessionStorage.removeItem("hasNewBooking");
    navigate("/profile");
  };

  // Handle menu close
  const handleMenuClose = () => {
    setIsMenuOpen(false);
    setShowProfileArrow(false);
    sessionStorage.removeItem("hasNewBooking");
  };

  return (
    <header className="bg-white/40 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-lg ">
            <img
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "hero" } });
              }}
              className="cursor-pointer"
              src="/logo3-rm.png"
              alt="Uncle Nomad Logo"
              width={200}
              height={60}
              style={{ display: "block" }}
            />
          </div>
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-6">
            <a
              href="#about"
              className="text-black hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:bg-clip-text hover:text-transparent"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "hero" } });
              }}>
              Home
            </a>
            <a
              href="#tours"
              className="text-black hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:bg-clip-text hover:text-transparent"
              onClick={(e) => {
                e.preventDefault();
                navigate("/tours");
              }}>
              Tours
            </a>
            <a
              href="#availability"
              className="text-black hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:bg-clip-text hover:text-transparent"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "availability" } });
              }}>
              Home Stay
            </a>
            <a
              href="#gallery"
              className="text-black hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:bg-clip-text hover:text-transparent"
              onClick={(e) => {
                e.preventDefault();
                navigate("/gallery");
              }}>
              Gallery
            </a>
            <a
              href="#blog"
              className="text-black hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:bg-clip-text hover:text-transparent"
              onClick={(e) => {
                e.preventDefault();
                navigate("/blog");
              }}>
              Blog
            </a>

            <a
              href="#footer"
              className="text-black hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:bg-clip-text hover:text-transparent"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "footer" } });
                setTimeout(() => {
                  window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: "smooth",
                  });
                  const getInTouchButton =
                    document.getElementById("get-in-touch");
                  if (getInTouchButton) {
                    getInTouchButton.classList.add("highlight");
                    setTimeout(() => {
                      getInTouchButton.classList.remove("highlight");
                    }, 2000);
                  }
                }, 100);
              }}>
              Contact Us
            </a>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 lg:gap-4 ">
                <TooltipProvider delayDuration={0}>
                  <Tooltip
                    defaultOpen={showProfileArrow}
                    open={showProfileArrow}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleProfileClick}
                        variant="ghost"
                        className="text-black hover:text-yellow px-2 lg:px-4 flex items-center gap-2">
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${
                            userName ? userName[0] : "U"
                          }`}
                          alt={userName}
                        />
                        <span className="hidden lg:inline text-black hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:bg-clip-text hover:text-transparent">
                          {userName}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    {showProfileArrow && (
                      <TooltipContent
                        side="bottom"
                        className="bg-white border border-gray-200 text-gray-900 p-4 rounded-lg shadow-xl z-50"
                        sideOffset={5}
                        onOpenAutoFocus={(e) => {
                          e.preventDefault();
                          console.log("Tooltip content focused");
                        }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-brand-purple rounded-full animate-pulse" />
                          <p className="text-sm font-medium">
                            Check your bookings here!
                          </p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 px-2 lg:px-4">
                  <LogOut className="h-4 w-4 mr-1 lg:mr-2" />
                  <span className="hidden lg:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                variant="ghost"
                className="text-black hover:text-yellow px-2 lg:px-4">
                <LogIn className="h-4 w-4 mr-1 lg:mr-2" />
                <span className="hidden lg:inline">Login</span>
              </Button>
            )}
          </nav>
          <button
            className="md:hidden"
            onClick={() =>
              isMenuOpen ? handleMenuClose() : setIsMenuOpen(true)
            }
            aria-expanded={isMenuOpen}>
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}>
        <div className="container mx-auto w-full">
          <nav className="flex flex-col space-y-4 py-2 items-center bg-transparent shadow-lg rounded-lg p-4">
            <div className="flex flex-col">
              <a
                href="#hero"
                className="w-full max-w-max inline-flex my-2 items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start text-black active:bg-gradient-to-r active:from-blue-500 active:via-purple-500 active:to-pink-500 active:bg-clip-text active:text-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/", { state: { section: "hero" } });
                  setIsMenuOpen(false);
                }}>
                <Home className="h-6 w-6" />
                <span>Home</span>
              </a>
              <a
                href="#tours"
                className="w-full max-w-max inline-flex my-2 items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start text-black active:bg-gradient-to-r active:from-blue-500 active:via-purple-500 active:to-pink-500 active:bg-clip-text active:text-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/tours");
                  setIsMenuOpen(false);
                }}>
                <Compass className="h-6 w-6" />
                <span>Tours</span>
              </a>
              <a
                href="#availability"
                className="w-full max-w-max inline-flex  my-2 items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start text-black active:bg-gradient-to-r active:from-blue-500 active:via-purple-500 active:to-pink-500 active:bg-clip-text active:text-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/", { state: { section: "availability" } });
                  setIsMenuOpen(false);
                }}>
                <Bed className="h-6 w-6" />
                <span>Home Stay</span>
              </a>
              <a
                href="#gallery"
                className="w-full max-w-max inline-flex my-2 items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start text-black active:bg-gradient-to-r active:from-blue-500 active:via-purple-500 active:to-pink-500 active:bg-clip-text active:text-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/gallery");
                  setIsMenuOpen(false);
                }}>
                <Image className="h-6 w-6" />
                <span>Gallery</span>
              </a>
              <a
                href="#blog"
                className="w-full max-w-max inline-flex my-2 items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start text-black active:bg-gradient-to-r active:from-blue-500 active:via-purple-500 active:to-pink-500 active:bg-clip-text active:text-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/blog");
                  setIsMenuOpen(false);
                }}>
                <FileText className="h-6 w-6" />
                <span>Blog</span>
              </a>
              <a
                href="#footer"
                className="w-full max-w-max inline-flex my-2 items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start text-black active:bg-gradient-to-r active:from-blue-500 active:via-purple-500 active:to-pink-500 active:bg-clip-text active:text-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/", { state: { section: "footer" } });
                  setIsMenuOpen(false);
                  setTimeout(() => {
                    window.scrollTo({
                      top: document.documentElement.scrollHeight,
                      behavior: "smooth",
                    });
                  }, 100);
                }}>
                <Mail className="h-6 w-6" />
                <span>Contact Us</span>
              </a>
              {/* Add authentication buttons to mobile menu */}
              <div className="w-full border-t border-gray-200 my-2 pt-2">
                {isAuthenticated ? (
                  <>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip defaultOpen={showProfileArrow}>
                        <TooltipTrigger asChild>
                          <a
                            className="w-full max-w-max inline-flex my-2 items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start text-black active:bg-gradient-to-r active:from-blue-500 active:via-purple-500 active:to-pink-500 active:bg-clip-text active:text-transparent"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate("/profile");
                              setIsMenuOpen(false);
                            }}>
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${
                                userName ? userName[0] : "U"
                              }`}
                              alt={userName}
                            />
                            <span>{userName || "Profile"}</span>
                          </a>
                        </TooltipTrigger>
                        {showProfileArrow && (
                          <TooltipContent
                            side="bottom"
                            className="bg-white border border-gray-200 text-gray-900 p-4 rounded-lg shadow-xl z-50"
                            sideOffset={5}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-brand-purple rounded-full animate-pulse" />
                              <p className="text-sm font-medium">
                                Check your bookings here!
                              </p>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    <a
                      className="w-full max-w-max inline-flex my-2 items-center gap-3 text-red-500 hover:text-red-600 transition-colors py-2 px-4 justify-start"
                      onClick={(e) => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}>
                      <LogOut className="h-6 w-6" />
                      <span>Logout</span>
                    </a>
                  </>
                ) : (
                  <a
                    className="w-full max-w-max inline-flex my-2 items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsLoginModalOpen(true);
                      setIsMenuOpen(false);
                    }}>
                    <LogIn className="h-6 w-6" />
                    <span>Login</span>
                  </a>
                )}
              </div>
            </div>
          </nav>
        </div>
      </div>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </header>
  );
};

export default Header;
