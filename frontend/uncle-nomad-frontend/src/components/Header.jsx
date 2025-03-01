"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Menu } from "lucide-react"
import { useNavigate, Link } from 'react-router-dom'
import { Home, Image, Mail, Compass, Bed } from "lucide-react"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const adminStatus = sessionStorage.getItem('isAdmin')
    setIsAdmin(adminStatus === 'true')
  }, [])

  return (
    <header className="bg-white/40 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-lg">
            <img
              onClick={(e) => {
                e.preventDefault();
                const section = document.getElementById('hero');
                if (section) {
                  const offset = 80;
                  const elementPosition = section.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - offset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
              }}
             src="/logo3-rm.png" alt="Uncle Nomad Logo" width={200} height={60} style={{display:'block'}}/>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="#about" 
              className="text-black hover:text-yellow"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "about" } });
              }}
            >
              Home
            </a>
            <a 
              href="#tours" 
              className="text-black hover:text-yellow"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "tours" } });
              }}
            >
              Tours
            </a>
            <a 
              href="#availability" 
              className="text-black hover:text-yellow"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "availability" } });
              }}
            >
              Stays
            </a>
            <a 
              href="#gallery" 
              className="text-black hover:text-yellow"
              onClick={(e) => {
                e.preventDefault();
                navigate('/gallery')
              }}
            >
              Gallery
            </a>

            <Button
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "get-in-touch" } });
                const getInTouchButton = document.getElementById("get-in-touch");
                if (getInTouchButton) {
                  getInTouchButton.classList.add("highlight");
                  setTimeout(() => {
                    getInTouchButton.classList.remove("highlight");
                  }, 2000); // Remove highlight after 2 seconds
                }
              }}
            >
              Contact Us
            </Button>


          </nav>
          <button 
            className="md:hidden" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container mx-auto w-full ">
        <nav className="flex flex-col space-y-2 py-2 items-center bg-transparent shadow-lg rounded-lg p-4">
          {/* Wrap everything in a div to match the Contact Us width */}
          <div className="flex flex-col">
            <a
              href="#about"
              className="w-full max-w-max inline-flex items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "about" } });
                setIsMenuOpen(false);
              }}
            >
              <Home className="h-6 w-6" />
              <span>Home</span>
            </a>
            <a
              href="#tours"
              className="w-full max-w-max inline-flex items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "tours" } });
                setIsMenuOpen(false);
              }}
            >
              <Compass className="h-6 w-6" />
              <span>Tours</span>
            </a>
            <a
              href="#availability"
              className="w-full max-w-max inline-flex items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "availability" } });
                setIsMenuOpen(false);
              }}
            >
              <Bed className="h-6 w-6" />
              <span>Stays</span>
            </a>
            <a
              href="#gallery"
              className="w-full max-w-max inline-flex items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start"
              onClick={(e) => {
                e.preventDefault();
                navigate("/gallery");
                setIsMenuOpen(false);
              }}
            >
              <Image className="h-6 w-6" />
              <span>Gallery</span>
            </a>
            <a
              href="#contact"
              className="w-full max-w-max inline-flex items-center gap-3 text-black hover:text-brand-purple transition-colors py-2 px-4 justify-start"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "get-in-touch" } });
                setIsMenuOpen(false);
              }}
            >
              <Mail className="h-6 w-6" />
              <span>Contact Us</span>
            </a>
          </div>
        </nav>

       </div>
      </div>
    </header>
  )
}

export default Header
