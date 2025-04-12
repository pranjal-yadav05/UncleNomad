import { useState } from "react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import QueryModal from "../modals/QueryModal";

const Footer = () => {
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);

  return (
    <footer
      id="footer"
      className="relative bg-cover bg-center bg-no-repeat text-gray-300"
      style={{ backgroundImage: "url('/footer.jpeg')" }}>
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative container mx-auto px-6 py-12">
        {/* Logo and Description Section */}
        <div className="flex flex-col items-center text-center mb-12">
          <img
            src="/logo2.PNG"
            alt="Uncle Nomad"
            width={250}
            height={250}
            className="mb-4"
          />
          <Button
            variant="outline"
            id="get-in-touch"
            className="bg-transparent text-white hover:bg-white/10 border-white/20 mb-10"
            onClick={() => setIsQueryModalOpen(true)}>
            Get in Touch
          </Button>
          <QueryModal
            open={isQueryModalOpen}
            onClose={() => setIsQueryModalOpen(false)}
          />

          <p
            className="max-w-lg text-gray-300 mb-10"
            style={{ fontFamily: "Playwrite IT Moderna" }}>
            Discover breathtaking mountain getaways and unforgettable adventures
            with Uncle Nomad. Your journey to extraordinary experiences starts
            here.
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center relative z-10">
          {/* Follow Us */}
          <div className="space-y-6">
            <h3
              className="text-2xl font-bold text-white tracking-wide"
              style={{ fontFamily: "SeaGardens, sans-serif" }}>
              Follow Us
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://m.facebook.com/unclenomad.in/"
                  className="text-gray-300 hover:text-white transition-colors duration-200">
                  <i className="fab fa-facebook-f m-2"></i>
                  unclenomad.in
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/unclenomad.in"
                  className="text-gray-300 hover:text-white transition-colors duration-200">
                  <i className="fab fa-instagram m-2"></i>
                  unclenomad.in
                </a>
              </li>
              <li>
                <a
                  href="https://www.tripadvisor.in/Hotel_Review-g297618-d26322947-Reviews-Uncle_Nomad-Manali_Kullu_District_Himachal_Pradesh.html"
                  className="text-gray-300 hover:text-white transition-colors duration-200">
                  <i className="fa-solid fa-suitcase m-2"></i>
                  Tripadvisor
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3
              className="text-2xl font-bold text-white tracking-wide"
              style={{ fontFamily: "SeaGardens, sans-serif" }}>
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li>
                <h4 className="text-lg font-semibold text-white tracking-wide">
                  Email
                </h4>
                <p className="text-gray-300">info@unclenomad.com</p>
              </li>
              <li>
                <h4 className="text-lg font-semibold text-white tracking-wide">
                  Phone
                </h4>
                <p className="text-gray-300">
                  <a
                    href="tel:+917984691219"
                    className="text-blue-400 hover:underline">
                    +91-7984691219
                  </a>
                </p>
                <p className="text-gray-300">
                  <a
                    href="tel:+919760777730"
                    className="text-blue-400 hover:underline">
                    +91-9760777730
                  </a>
                </p>
              </li>
              <li>
                <h4 className="text-lg font-semibold text-white tracking-wide">
                  Address
                </h4>
                <p className="text-gray-300">
                  Uncle Nomad, Behind Clubhouse, <br /> Shnag Road, Old Manali,
                  <br /> Manali . 137151
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
