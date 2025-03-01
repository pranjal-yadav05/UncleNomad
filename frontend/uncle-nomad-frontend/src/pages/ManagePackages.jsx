"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import PackageFormModal from "../modals/PackageFormModal";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "../components/ui/table";

export default function ManagePackages() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [packages, setPackages] = useState([]);
  const [newPackage, setNewPackage] = useState({
    id: "",
    title: "",
    description: "",
    price: "",
    duration: "",
    groupSize: "",
    location: "",
    startDate: "",
    endDate: "",
    priceOptions: {},
    inclusions: [],
    exclusions: [],
    itinerary: [],
    images: []  // Changed from image to images array to match PackageFormModal
  });

  const [currentDay, setCurrentDay] = useState({
    day: "",
    title: "",
    description: "",
    activities: "",
    accommodation: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [currentPackageId, setCurrentPackageId] = useState(null);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPackages();
    setIsModalOpen(false);
  }, []);

  const fetchPackages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/api/tours`, {headers: {"x-api-key": process.env.REACT_APP_API_KEY}});
      if (!response.ok) throw new Error("Failed to fetch packages");
      const data = await response.json();
      setPackages(data);
    } catch (error) {
      console.error("Error fetching packages:", error);
      setError("Failed to load packages. Please try again.");
    } finally{
      setIsLoading(false)
    }
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    setIsUploading(true);
  
    try {
      const formData = new FormData();
  
      // Append text fields to FormData
      formData.append("id", newPackage.id);
      formData.append("title", newPackage.title);
      formData.append("description", newPackage.description);
      formData.append("price", newPackage.price);
      formData.append("duration", newPackage.duration);
      formData.append("groupSize", newPackage.groupSize);
      formData.append("location", newPackage.location);
      formData.append("startDate", newPackage.startDate ? new Date(newPackage.startDate).toISOString() : "");
      formData.append("endDate", newPackage.endDate ? new Date(newPackage.endDate).toISOString() : "");
  
      // Convert JSON fields to string before sending
      formData.append("priceOptions", JSON.stringify(newPackage.priceOptions || {}));
      formData.append("inclusions", JSON.stringify(newPackage.inclusions || []));
      formData.append("exclusions", JSON.stringify(newPackage.exclusions || []));
      formData.append("itinerary", JSON.stringify(newPackage.itinerary || []));
  
      // Append all images to FormData
      if (newPackage.images && newPackage.images.length > 0) {
        newPackage.images.forEach((image) => {
          if (typeof image !== "string") {
            formData.append("images", image);  // Only append new File objects
          }
        });
      }
  
      console.log("🚀 Sending FormData to API...");
      const url = editMode ? `${API_URL}/api/tours/${currentPackageId}` : `${API_URL}/api/tours`;
      const method = editMode ? "PUT" : "POST";
  
      const response = await fetch(url, {
        method,
        headers: {"x-api-key": process.env.REACT_APP_API_KEY},
        body: formData, // ✅ Send as FormData, NOT JSON
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save package");
      }
  
      console.log("✅ Package saved successfully!");
      fetchPackages();
      resetForm();
    } catch (error) {
      console.error("❌ Package creation error:", error);
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsUploading(false);
    }
  };
  
  const resetForm = () => {
    setIsModalOpen(false);
    setNewPackage({
      id: "",
      title: "",
      description: "",
      price: "",
      duration: "",
      groupSize: "",
      location: "",
      startDate: "",
      endDate: "",
      priceOptions: {},
      inclusions: [],
      exclusions: [],
      itinerary: [],
      images: [],  // Changed from image to images array
    });
    setCurrentDay({
      day: "",
      title: "",
      description: "",
      activities: "",
      accommodation: "",
    });
    setEditMode(false);
    setCurrentPackageId(null);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Manage Packages</h2>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Tour Packages</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-8">
        <Button variant='custom' onClick={() => setIsModalOpen(true)}>Add New Package</Button>
      </div>

      <PackageFormModal
        isOpen={isModalOpen}
        onClose={resetForm}
        newPackage={newPackage}
        setNewPackage={setNewPackage}
        currentDay={currentDay}
        setCurrentDay={setCurrentDay}
        handleAddPackage={handleAddPackage}
        editMode={editMode}
        isUploading={isUploading}
        setIsModalOpen={setIsModalOpen}
      />

      <h3 className="text-xl font-semibold mb-4 text-gray-800">Existing Packages</h3>
      <Card>
        <Table className="border border-gray-300">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Group Size</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg._id} className="hover:bg-gray-50">
                <TableCell>
                  {/* Display the first image from the images array if available */}
                  {pkg.images && pkg.images.length > 0 ? (
                    <img 
                      src={pkg.images[0]} 
                      alt={pkg.title} 
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : pkg.image ? (
                    <img 
                      src={pkg.image} 
                      alt={pkg.title} 
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : null}
                </TableCell>
                <TableCell className="font-medium">{pkg.title}</TableCell>
                <TableCell className="max-w-[300px] truncate">{pkg.description}</TableCell>
                <TableCell className="text-right">₹{pkg.price}</TableCell>
                <TableCell>{pkg.duration}</TableCell>
                <TableCell>{pkg.groupSize}</TableCell>
                <TableCell>{pkg.location}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      // Handle both old packages with image and new ones with images array
                      const packageImages = pkg.images && pkg.images.length > 0 
                        ? pkg.images 
                        : (pkg.image ? [pkg.image] : []);
                        
                      setNewPackage({
                        _id:pkg._id,
                        id: pkg.id,
                        title: pkg.title,
                        description: pkg.description,
                        price: pkg.price.toString(),
                        duration: pkg.duration,
                        groupSize: pkg.groupSize,
                        location: pkg.location,
                        startDate: pkg.startDate ? new Date(pkg.startDate).toISOString().split("T")[0] : "",
                        endDate: pkg.endDate ? new Date(pkg.endDate).toISOString().split("T")[0] : "",
                        priceOptions: pkg.priceOptions || {},
                        inclusions: pkg.inclusions || [],
                        exclusions: pkg.exclusions || [],
                        itinerary: pkg.itinerary || [],
                        images: packageImages
                      });
                      setEditMode(true);
                      setCurrentPackageId(pkg._id);
                      setIsModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="ghost"
                    className="text-red-500"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this package?")) {
                        try {
                          const response = await fetch(`${API_URL}/api/tours/${pkg._id}`, {
                            method: "DELETE",
                            headers: {"x-api-key": process.env.REACT_APP_API_KEY}
                          });
                          if (response.ok) fetchPackages();
                        } catch (error) {
                          console.error("Error deleting package:", error);
                          setError("Failed to delete package");
                        }
                      }
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}