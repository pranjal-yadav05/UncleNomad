import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function GalleryPage() {
  const [folders, setFolders] = useState([]);
  const [imagesByFolder, setImagesByFolder] = useState({});
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" }); // Ensures an immediate scroll to the top
    });
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedMedia) {
      document.body.style.overflow = 'hidden';
      
      // Add event listeners for keyboard navigation
      window.addEventListener('keydown', handleKeyDown);
      
      // Add event listener for mouse wheel
      window.addEventListener('wheel', handleWheel);
    } else {
      document.body.style.overflow = 'auto';
      
      // Remove event listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    }
    
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [selectedMedia, currentImageIndex]);

  const handleKeyDown = (e) => {
    if (!selectedMedia) return;
    
    const currentFolder = selectedMedia.folder;
    const images = imagesByFolder[currentFolder] || [];
    
    if (e.key === 'ArrowLeft') {
      navigateImages('prev', images);
    } else if (e.key === 'ArrowRight') {
      navigateImages('next', images);
    } else if (e.key === 'Escape') {
      setSelectedMedia(null);
    }
  };

  const handleWheel = (e) => {
    if (!selectedMedia) return;
    
    const currentFolder = selectedMedia.folder;
    const images = imagesByFolder[currentFolder] || [];
    
    // Scroll down or right = next image
    if (e.deltaY > 0 || e.deltaX > 0) {
      navigateImages('next', images);
    } 
    // Scroll up or left = previous image
    else if (e.deltaY < 0 || e.deltaX < 0) {
      navigateImages('prev', images);
    }
  };

  const navigateImages = (direction, images) => {
    if (images.length <= 1) return;
    
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
      setSelectedMedia({
        ...images[(currentImageIndex + 1) % images.length],
        folder: selectedMedia.folder,
        index: (currentImageIndex + 1) % images.length
      });
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      setSelectedMedia({
        ...images[(currentImageIndex - 1 + images.length) % images.length],
        folder: selectedMedia.folder,
        index: (currentImageIndex - 1 + images.length) % images.length
      });
    }
  };

  async function fetchFolders() {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/gallery/folders`, {
        headers: { "x-api-key": process.env.REACT_APP_API_KEY }
      });
      setFolders(response.data);
      
      // Initialize expanded state for all folders
      const initialExpandedState = {};
      response.data.forEach(folder => {
        initialExpandedState[folder.name] = true;
      });
      setExpandedFolders(initialExpandedState);
      
      // Fetch images for all folders
      response.data.forEach(folder => {
        fetchImages(folder.name);
      });
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  }

  async function fetchImages(folderName) {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/gallery/folders/${folderName}`, {
        headers: { "x-api-key": process.env.REACT_APP_API_KEY }
      });
      setImagesByFolder(prev => ({ ...prev, [folderName]: response.data }));
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  }

  function toggleFolder(folderName) {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  }

  function openMediaViewer(media, folderName, index) {
    setCurrentImageIndex(index);
    setSelectedMedia({
      ...media,
      folder: folderName,
      index: index
    });
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-extrabold tracking-tight mb-2">Journey in Frames</h1>
            <p className="text-xl text-gray-300">Pictures Perfect Moments</p>
          </motion.div>

          {folders.map((folder, folderIndex) => (
            <motion.div 
              key={folderIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: folderIndex * 0.1 }}
              className="mb-16"
            >
              <button 
                onClick={() => toggleFolder(folder.name)}
                className="w-full flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg mb-4 transition-all duration-300 hover:from-blue-700 hover:to-purple-700"
              >
                <h2 className="text-2xl font-bold">{folder.name}</h2>
                <span className="text-2xl">
                  {expandedFolders[folder.name] ? '−' : '+'}
                </span>
              </button>

              <AnimatePresence>
                {expandedFolders[folder.name] && imagesByFolder[folder.name] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <button 
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-all"
                        onClick={(e) => {
                          e.preventDefault();
                          const container = carouselRef.current;
                          container.scrollBy({ left: -300, behavior: 'smooth' });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <div 
                        ref={carouselRef}
                        className="flex overflow-x-auto gap-4 py-4 px-12 hide-scrollbar snap-x snap-mandatory"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {imagesByFolder[folder.name].map((media, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            className="snap-center shrink-0 first:pl-12 last:pr-12"
                          >
                            <div 
                              className="w-[300px] h-[200px] rounded-lg overflow-hidden shadow-xl cursor-pointer relative perspective-card"
                              onClick={() => openMediaViewer(media, folder.name, idx)}
                            >
                              {media.type === "video" ? (
                                <video className="w-full h-full object-cover">
                                  <source src={media.url} type="video/mp4" />
                                </video>
                              ) : (
                                <img 
                                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                                  src={media.url || "/placeholder.svg"} 
                                  alt={`${folder.name} media ${idx + 1}`} 
                                  loading="lazy"
                                />
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      <button 
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-all"
                        onClick={(e) => {
                          e.preventDefault();
                          const container = carouselRef.current;
                          container.scrollBy({ left: 300, behavior: 'smooth' });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />

      {/* Media Viewer Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative max-w-5xl max-h-[90vh] w-full"
            >
              {/* Navigation Buttons */}
              <button 
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  const images = imagesByFolder[selectedMedia.folder] || [];
                  navigateImages('prev', images);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  const images = imagesByFolder[selectedMedia.folder] || [];
                  navigateImages('next', images);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Close Button */}
              <button 
                className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-full z-10 hover:bg-black/70 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMedia(null);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full z-10">
                {currentImageIndex + 1} / {(imagesByFolder[selectedMedia.folder] || []).length}
              </div>

              {/* Image or Video */}
              {selectedMedia.type === "video" ? (
                <video 
                  controls 
                  autoPlay
                  className="max-w-full max-h-[90vh] object-contain rounded-lg mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <source src={selectedMedia.url} type="video/mp4" />
                </video>
              ) : (
                <img 
                  src={selectedMedia.url || "/placeholder.svg"} 
                  alt="Gallery Media" 
                  className="max-w-full max-h-[90vh] object-contain rounded-lg mx-auto"
                  loading="lazy"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}