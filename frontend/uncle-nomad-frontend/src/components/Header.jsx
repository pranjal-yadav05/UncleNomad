"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Menu } from "lucide-react"
import { useNavigate, Link } from 'react-router-dom'

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
        <div className="container mx-auto px-4">
          <nav className="flex flex-col space-y-2 py-2 bg-transparent shadow-lg rounded-lg p-4">
            <a 
              href="#about" 
              className="text-black hover:text-brand-purple transition-colors py-2 transform transition-transform duration-200 hover:translate-x-2"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "about" } });
              }}
            >
              Home
            </a>
            <a 
              href="#availability" 
              className="text-black hover:text-brand-purple transition-colors py-2 transform transition-transform duration-200 hover:translate-x-2"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "availability" } });
              }}
            >
              Stays
            </a>
            <a 
              href="#tours" 
              className="text-black hover:text-brand-purple transition-colors py-2 transform transition-transform duration-200 hover:translate-x-2"
              onClick={(e) => {
                e.preventDefault();
                navigate("/", { state: { section: "tours" } });
              }}
            >
              Tours
            </a>
            <a 
              href="#gallery" 
              className="text-black hover:text-brand-purple transition-colors py-2 transform transition-transform duration-200 hover:translate-x-2"
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
              }}
            >
              Contact Us
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
