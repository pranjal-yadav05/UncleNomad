import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function GalleryPage() {
  const [folders, setFolders] = useState([]);
  const [imagesByFolder, setImagesByFolder] = useState({});
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchFolders();
  }, []);

  async function fetchFolders() {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/gallery/folders`);
      setFolders(response.data);
      if (response.data.length > 0) {
        setSelectedFolder(response.data[0].name);
        fetchImages(response.data[0].name);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  }

  async function fetchImages(folderName) {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/gallery/folders/${folderName}`);
      setImagesByFolder(prev => ({ ...prev, [folderName]: response.data }));
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  }

  function handleFolderClick(folderName) {
    setSelectedFolder(folderName);
    if (!imagesByFolder[folderName]) {
      fetchImages(folderName);
    }
  }

  return (
    <>
      <Header />
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-extrabold mb-8 text-center text-gray-900 dark:text-white">Photo Gallery</h2>

        {/* Folder Selection */}
        <div className="flex gap-4 overflow-x-auto pb-4 border-b border-gray-300 dark:border-gray-600 mb-8">
          {folders.map((folder, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-lg transition ${
                selectedFolder === folder.name
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              }`}
              onClick={() => handleFolderClick(folder.name)}
            >
              {folder.name}
            </button>
          ))}
        </div>

        {/* Selected Folder Display */}
        {selectedFolder && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{selectedFolder}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {imagesByFolder[selectedFolder]?.map((media, idx) => (
                <div
                  key={idx}
                  className="cursor-pointer w-full h-40 overflow-hidden rounded-lg shadow-lg hover:scale-105 transition"
                  onClick={() => setSelectedMedia(media)}
                >
                  {media.type === "video" ? (
                    <video className="w-full h-full object-cover" src={media.url} />
                  ) : (
                    <img className="w-full h-full object-cover" src={media.url} alt="Gallery Media" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Modal */}
        {selectedMedia && (
          <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Media Preview</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center items-center">
                {selectedMedia.type === "video" ? (
                  <video controls className="max-w-full max-h-[80vh]">
                    <source src={selectedMedia.url} type="video/mp4" />
                  </video>
                ) : (
                  <img src={selectedMedia.url} alt="Gallery Media" className="max-w-full max-h-[80vh]" />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </section>
      <Footer />
    </>
  );
}
