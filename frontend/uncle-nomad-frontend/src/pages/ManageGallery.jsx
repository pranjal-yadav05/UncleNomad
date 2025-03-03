import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { FolderOpen, UploadCloud, Trash } from "lucide-react";

const ManageGallery = () => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [media, setMedia] = useState([]);
  const [newFolder, setNewFolder] = useState("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState("image");

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/gallery/folders`,{headers:{"x-api-key": process.env.REACT_APP_API_KEY}});
      setFolders(response.data);
    } catch (error) {
      console.error("Failed to load folders.", error);
    }
  };

  const fetchMedia = async (folderName) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/gallery/folders/${folderName}`,{headers:{"x-api-key": process.env.REACT_APP_API_KEY}});
      setMedia(response.data);
      setSelectedFolder(folderName);
    } catch (error) {
      console.error("Failed to load media.", error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolder.trim()) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/gallery/folders`, { name: newFolder },{headers:{"x-api-key": process.env.REACT_APP_API_KEY}});
      setNewFolder("");
      fetchFolders();
    } catch (error) {
      console.error("Failed to create folder.", error);
    }
  };

  const handleDeleteFolder = async (folderName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/gallery/folders/${folderName}`, {
        method: "DELETE",
        headers: {"x-api-key": process.env.REACT_APP_API_KEY}
      });
      if (response.ok) {
        fetchFolders()
        // Update UI accordingly
      } else {
        console.error("Failed to delete folder");
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };
  

  const handleUploadMedia = async () => {
    if (!file || !selectedFolder) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", fileType);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/gallery/folders/${selectedFolder}/media`, formData,{headers:{"x-api-key": process.env.REACT_APP_API_KEY}});
      fetchMedia(selectedFolder);
    } catch (error) {
      console.error("Upload failed.", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (publicId) => {
    if(!selectedFolder) return
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/gallery/folders/${selectedFolder}/media/${publicId}`, {
        method: "DELETE",
        headers: {"x-api-key": process.env.REACT_APP_API_KEY}
      });
  
      if (response.ok) {
        fetchMedia(selectedFolder); // Refresh media list
      } else {
        console.error("Failed to delete media");
      }
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };
  
  

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Manage Media Gallery</h2>

      <div className="flex gap-4">
        <Input type="text" placeholder="Folder Name" value={newFolder} onChange={(e) => setNewFolder(e.target.value)} />
        <Button onClick={handleCreateFolder}>Create</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
        {folders.map((folder) => (
          <div key={folder.name} className="p-4 shadow rounded-lg relative">
            <FolderOpen className="w-10 h-10 text-blue-500 mx-auto" />
            <h4 className="text-center mt-2 font-medium">{folder.name}</h4>
            <Button variant="outline" className="w-full mt-2" onClick={() => fetchMedia(folder.name)}>Open</Button>
            <Button variant="destructive" className="absolute top-2 right-2" onClick={() => handleDeleteFolder(folder.name)}>
                <Trash className="w-4 h-4" />
            </Button>

          </div>
        ))}
      </div>

      <Dialog open={!!selectedFolder} onOpenChange={() => setSelectedFolder(null)}>
        <DialogContent className="max-w-5xl">

          <DialogHeader>
            <DialogTitle>{selectedFolder}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-4 mt-4">
            <Input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <select onChange={(e) => setFileType(e.target.value)} value={fileType}>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
            <Button onClick={handleUploadMedia} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
              <UploadCloud className="ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 max-h-[50vh] overflow-y-auto">

            {media.length === 0 ? (
              <p>No media found.</p>
            ) : (
              media.map((item) => (
                <div key={item.id} className="p-2 border rounded-lg overflow-hidden relative">
                  {item.type === "image" ? (
                    <img src={item.url} alt="media" className="w-full h-48 object-cover" />
                  ) : (
                    <video controls className="w-full h-48">
                      <source src={item.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                  <Button variant="destructive" className="absolute top-2 right-2" onClick={() => handleDeleteMedia(item.publicId)}>
                    <Trash className="w-4 h-4" />
                  </Button>

                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageGallery;