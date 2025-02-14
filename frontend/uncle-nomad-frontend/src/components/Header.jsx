"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Menu } from "lucide-react"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white/40 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-lg">
            <img src="logo3-rm.png" alt="Uncle Nomad Logo" width={200} height={60} />
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#stays" className="text-gray-600 hover:text-brand-purple transition-colors">
              Stays
            </a>
            <a href="#tours" className="text-gray-600 hover:text-brand-purple transition-colors">
              Tours
            </a>
            <a href="#guides" className="text-gray-600 hover:text-brand-purple transition-colors">
              Tour Guides
            </a>
            <a href="#about" className="text-gray-600 hover:text-brand-purple transition-colors">
              About Us
            </a>
            <Button>Contact Us</Button>
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
      {/* Aquamorphic Dropdown Menu */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container mx-auto px-4">
          <nav className="flex flex-col space-y-2 py-2 bg-transparent shadow-lg rounded-lg p-4">
            <a href="#stays" className="text-black hover:text-brand-purple transition-colors py-2 transform transition-transform duration-200 hover:translate-x-2">
              Stays
            </a>
            <a href="#tours" className="text-black hover:text-brand-purple transition-colors py-2 transform transition-transform duration-200 hover:translate-x-2">
              Tours
            </a>
            <a href="#guides" className="text-black hover:text-brand-purple transition-colors py-2 transform transition-transform duration-200 hover:translate-x-2">
              Tour Guides
            </a>
            <a href="#about" className="text-black hover:text-brand-purple transition-colors py-2 transform transition-transform duration-200 hover:translate-x-2">
              About Us
            </a>
            <Button className="w-full">Contact Us</Button>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
