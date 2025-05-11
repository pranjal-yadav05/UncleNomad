"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function GalleryPage() {
  const [folders, setFolders] = useState([]);
  const [imagesByFolder, setImagesByFolder] = useState({});
  const [activeFolder, setActiveFolder] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedMedia) {
      document.body.style.overflow = "hidden";

      // Add event listeners for keyboard navigation
      window.addEventListener("keydown", handleKeyDown);

      // Add event listener for mouse wheel
      window.addEventListener("wheel", handleWheel);
    } else {
      document.body.style.overflow = "auto";

      // Remove event listeners
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    }

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [selectedMedia, currentImageIndex]);

  const handleKeyDown = (e) => {
    if (!selectedMedia) return;

    const currentFolder = selectedMedia.folder;
    const images = imagesByFolder[currentFolder] || [];

    if (e.key === "ArrowLeft") {
      navigateImages("prev", images);
    } else if (e.key === "ArrowRight") {
      navigateImages("next", images);
    } else if (e.key === "Escape") {
      setSelectedMedia(null);
    }
  };

  const handleWheel = (e) => {
    if (!selectedMedia) return;

    const currentFolder = selectedMedia.folder;
    const images = imagesByFolder[currentFolder] || [];

    // Scroll down or right = next image
    if (e.deltaY > 0 || e.deltaX > 0) {
      navigateImages("next", images);
    }
    // Scroll up or left = previous image
    else if (e.deltaY < 0 || e.deltaX < 0) {
      navigateImages("prev", images);
    }
  };

  const navigateImages = (direction, images) => {
    if (images.length <= 1) return;

    if (direction === "next") {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
      setSelectedMedia({
        ...images[(currentImageIndex + 1) % images.length],
        folder: selectedMedia.folder,
        index: (currentImageIndex + 1) % images.length,
      });
    } else {
      setCurrentImageIndex(
        (prev) => (prev - 1 + images.length) % images.length
      );
      setSelectedMedia({
        ...images[(currentImageIndex - 1 + images.length) % images.length],
        folder: selectedMedia.folder,
        index: (currentImageIndex - 1 + images.length) % images.length,
      });
    }
  };

  async function fetchFolders() {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/gallery/folders`,
        {
          headers: { "x-api-key": process.env.REACT_APP_API_KEY },
        }
      );
      setFolders(response.data);

      // Set the first folder as active by default
      if (response.data.length > 0) {
        setActiveFolder(response.data[0].name);
      }

      // Fetch images for all folders
      response.data.forEach((folder) => {
        fetchImages(folder.name);
      });
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  }

  async function fetchImages(folderName) {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/gallery/folders/${folderName}`,
        {
          headers: { "x-api-key": process.env.REACT_APP_API_KEY },
        }
      );
      setImagesByFolder((prev) => ({ ...prev, [folderName]: response.data }));
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  }

  function openMediaViewer(media, folderName, index) {
    setCurrentImageIndex(index);
    setSelectedMedia({
      ...media,
      folder: folderName,
      index: index,
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
            className="text-center mb-16">
            <h1 className="text-5xl font-extrabold tracking-tight mb-2">
              Together in Glimpses
            </h1>
            <p className="text-xl text-gray-300">Pictures Perfect Moments</p>
          </motion.div>

          <div className="relative">
            {/* Folder Tabs */}
            <div className="relative z-10">
              <div className="tabs-container">
                {/* Tab Headers */}
                <div className="tab-list">
                  {folders.map((folder, index) => (
                    <button
                      key={folder.name}
                      className={`tab-button ${
                        activeFolder === folder.name ? "active" : ""
                      }`}
                      onClick={() => setActiveFolder(folder.name)}>
                      {folder.name}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                  {folders.map((folder) => (
                    <div
                      key={folder.name}
                      className={`tab-panel ${
                        activeFolder === folder.name ? "active" : ""
                      }`}>
                      {activeFolder === folder.name && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}>
                          <div className="mb-8">
                            <h2 className="text-2xl font-bold">
                              {folder.name}
                            </h2>
                            <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-purple-600 mt-2"></div>
                          </div>

                          {imagesByFolder[folder.name] &&
                          imagesByFolder[folder.name].length > 0 ? (
                            <div className="relative px-4 py-6">
                              <div
                                ref={carouselRef}
                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8 py-6">
                                {imagesByFolder[folder.name].map(
                                  (media, idx) => (
                                    <motion.div
                                      key={idx}
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="flex justify-center p-2">
                                      <div
                                        className="w-full h-[350px] rounded-lg overflow-hidden shadow-xl cursor-pointer relative perspective-card"
                                        onClick={() =>
                                          openMediaViewer(
                                            media,
                                            folder.name,
                                            idx
                                          )
                                        }>
                                        {media.type === "video" ? (
                                          <video className="w-full h-full object-cover">
                                            <source
                                              src={media.url}
                                              type="video/mp4"
                                            />
                                          </video>
                                        ) : (
                                          <img
                                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                            src={
                                              media.url || "/placeholder.svg"
                                            }
                                            alt={`${folder.name} media ${
                                              idx + 1
                                            }`}
                                            loading="lazy"
                                          />
                                        )}
                                      </div>
                                    </motion.div>
                                  )
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-48 text-gray-400">
                              {imagesByFolder[folder.name]
                                ? "No images found in this folder"
                                : "Loading images..."}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
            onClick={() => setSelectedMedia(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative max-w-5xl max-h-[90vh] w-full">
              {/* Navigation Buttons */}
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  const images = imagesByFolder[selectedMedia.folder] || [];
                  navigateImages("prev", images);
                }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  const images = imagesByFolder[selectedMedia.folder] || [];
                  navigateImages("next", images);
                }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Close Button */}
              <button
                className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-full z-10 hover:bg-black/70 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMedia(null);
                }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full z-10">
                {currentImageIndex + 1} /{" "}
                {(imagesByFolder[selectedMedia.folder] || []).length}
              </div>

              {/* Image or Video */}
              {selectedMedia.type === "video" ? (
                <video
                  controls
                  autoPlay
                  className="max-w-full max-h-[90vh] object-contain rounded-lg mx-auto"
                  onClick={(e) => e.stopPropagation()}>
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

      <style jsx>{`
        .tabs-container {
          position: relative;
        }

        .tab-list {
          display: flex;
          position: relative;
          z-index: 10;
          margin-left: 10px;
        }

        .tab-button {
          position: relative;
          padding: 10px 20px;
          background-color: #1f2937;
          color: #e5e7eb;
          border: 2px solid #4b5563;
          border-bottom: none;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          font-weight: 500;
          margin-right: -2px;
          transition: all 0.2s ease;
          z-index: 1;
        }

        .tab-button:hover {
          background-color: #2d3748;
        }

        .tab-button.active {
          background-color: #374151;
          color: white;
          z-index: 3;
          border-color: #6366f1;
        }

        .tab-button.active::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #374151;
          z-index: 4;
        }

        .tab-content {
          position: relative;
          background-color: #374151;
          border: 2px solid #6366f1;
          border-radius: 0 8px 8px 8px;
          padding: 30px;
          z-index: 2;
          margin-top: -2px;
          margin-left: 10px;
          margin-right: 10px;
          margin-bottom: 40px;
        }

        .tab-panel {
          display: none;
        }

        .tab-panel.active {
          display: block;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .perspective-card {
          transition: transform 0.5s;
        }

        .perspective-card:hover {
          transform: perspective(1000px) rotateY(5deg);
        }
      `}</style>
    </>
  );
}
