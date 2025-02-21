import { useState } from 'react'
import { Button } from "./ui/button"
import { Link } from "react-router-dom"
import QueryModal from './QueryModal'


const Footer = () => {
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false)

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-6 py-6">
        {/* Logo and Description Section */}
        <div className="flex flex-col items-center text-center mb-12">
          <img
            src="logo2.PNG"
            alt="Uncle Nomad"
            width={250}
            height={250}
            className="mb-0"
          />
          <p className="max-w-lg text-gray-400 mb-6">
            Discover breathtaking mountain getaways and unforgettable adventures with Uncle Nomad. 
            Your journey to extraordinary experiences starts here.
          </p>
          <Button 
            variant="outline" 
            id='get-in-touch'
            className="bg-transparent text-white hover:bg-white/10 border-white/20"
            onClick={() => setIsQueryModalOpen(true)}
          >
            Get in Touch
          </Button>
          <QueryModal 
            open={isQueryModalOpen} 
            onClose={() => setIsQueryModalOpen(false)}
          />

        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center mb-12">
          {/* Follow Us */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Follow Us</h3>
            <ul className="space-y-4">
              <li>
                <a href="https://m.facebook.com/unclenomad.in/" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <i className="fab fa-facebook-f m-2"></i>
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://instagram.com/unclenomad.in" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <i className="fab fa-instagram m-2"></i>
                  Instagram
                </a>
              </li>
            </ul>
          </div>



          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Quick Links</h3>
            <ul className="space-y-4">
              {[
                'About Us',
                'Our Services',
                'Tour Packages',
                'Travel Guide',
                'Booking Terms'
              ].map((link) => (
                <li key={link}>
                  <Link 
                    to="#" 
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Contact Us</h3>
            <ul className="space-y-4">
              <li>
                <h4 className="text-white font-medium mb-1">Email</h4>
                <p className="text-gray-400">info@unclenomad.com</p>
              </li>
              <li>
                <h4 className="text-white font-medium mb-1">Phone</h4>
                <p className="text-gray-400">+91 (123) 456-7890</p>
              </li>
              <li>
                <h4 className="text-white font-medium mb-1">Address</h4>
                <p className="text-gray-400">
                  123 Mountain View Road,<br />
                  Manali, Himachal Pradesh
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
