"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import PackageFormModal from "../modals/PackageFormModal";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "../components/ui/table";

import { formatDate } from "../utils/dateUtils";

export default function ManagePackages() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [packages, setPackages] = useState([]);
  const [newPackage, setNewPackage] = useState({
    id: "",
    title: "",
    description: "",
    category: "Adventure",
    duration: "",
    location: "",
    inclusions: [],
    exclusions: [],
    itinerary: [],
    availableDates: [],
    pricingPackages: [],
    images: [],
    groupSize: "",
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchPackages(currentPage);
  }, [currentPage, sortField, sortOrder, categoryFilter]);

  const fetchPackages = async (page = 1) => {
    try {
      setIsLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page,
        limit: 10,
        sort: `${sortOrder === "desc" ? "-" : ""}${sortField}`,
      });

      // Add category filter if not 'all'
      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }

      // Add search term if present
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL
        }/api/tours/admin/tours?${params.toString()}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setPackages(data.tours);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error fetching tour packages:", error);
      setError("Failed to fetch tour packages");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page
    fetchPackages(1);
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (field === sortField) {
      // If clicking on the same field, toggle order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // If clicking on a new field, set it as sort field and default to ascending
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page
  };

  // Get sort indicator
  const getSortIndicator = (field) => {
    if (field !== sortField) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  // Handle category filter change
  const handleCategoryFilterChange = (value) => {
    setCategoryFilter(value);
    setCurrentPage(1); // Reset to first page
  };

  // Function to handle downloading all data as Excel
  const handleExportData = async () => {
    try {
      setExportLoading(true);
      setError(""); // Clear any previous errors

      // Build query parameters for filtered/sorted data
      const params = new URLSearchParams({
        sort: `${sortOrder === "desc" ? "-" : ""}${sortField}`,
      });

      // Add category filter if not 'all'
      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }

      // Add search term if present
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/tours/admin/tours/export?${params.toString()}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        setError("No tour packages found with the current filters");
        setExportLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Export failed" }));
        throw new Error(errorData.message || "Failed to export tour packages");
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to download the file
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Get current date for filename
      const today = new Date().toISOString().split("T")[0];

      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `tour_packages_export_${today}.xlsx`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportLoading(false);
    } catch (error) {
      console.error("Error exporting tour packages:", error);
      setError(`Failed to export tour packages: ${error.message}`);
      setExportLoading(false);
    }
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // Log the package data before validation
      console.log("📦 Package data before validation:", {
        title: newPackage.title,
        description: newPackage.description,
        category: newPackage.category,
        duration: newPackage.duration,
        location: newPackage.location,
        groupSize: newPackage.groupSize,
        availableDates: newPackage.availableDates,
        pricingPackages: newPackage.pricingPackages,
      });

      // Validate required fields
      if (
        !newPackage.title ||
        !newPackage.description ||
        !newPackage.duration ||
        !newPackage.location ||
        !newPackage.groupSize ||
        !newPackage.availableDates ||
        newPackage.availableDates.length === 0 ||
        !newPackage.pricingPackages ||
        newPackage.pricingPackages.length === 0
      ) {
        console.log("❌ Missing required fields:", {
          title: !newPackage.title,
          description: !newPackage.description,
          duration: !newPackage.duration,
          location: !newPackage.location,
          groupSize: !newPackage.groupSize,
          availableDates:
            !newPackage.availableDates ||
            newPackage.availableDates.length === 0,
          pricingPackages:
            !newPackage.pricingPackages ||
            newPackage.pricingPackages.length === 0,
        });
        throw new Error("All fields are required");
      }

      const formData = new FormData();

      // Append basic fields
      // Generate a numeric ID if not provided
      if (!newPackage.id) {
        formData.append("id", Math.floor(Math.random() * 10000).toString());
      } else {
        formData.append("id", newPackage.id.toString());
      }

      formData.append("title", newPackage.title);
      formData.append("description", newPackage.description);
      formData.append("category", newPackage.category || "Adventure");
      formData.append("duration", newPackage.duration);
      formData.append("location", newPackage.location);
      formData.append("groupSize", newPackage.groupSize);

      // Process itinerary to remove problematic _id field
      const processedItinerary = newPackage.itinerary.map((item) => {
        // Create a new object without _id or remove invalid _id
        const { _id, ...rest } = item;
        return rest;
      });

      // Ensure inclusions and exclusions are always arrays
      const inclusionsArray = Array.isArray(newPackage.inclusions)
        ? newPackage.inclusions
        : [];
      const exclusionsArray = Array.isArray(newPackage.exclusions)
        ? newPackage.exclusions
        : [];

      // Debug log for inclusions and exclusions
      console.log("Inclusions before sending:", inclusionsArray);
      console.log("Exclusions before sending:", exclusionsArray);

      // Append arrays and objects
      formData.append("inclusions", JSON.stringify(inclusionsArray));
      formData.append("exclusions", JSON.stringify(exclusionsArray));
      formData.append("itinerary", JSON.stringify(processedItinerary || []));
      formData.append(
        "availableDates",
        JSON.stringify(newPackage.availableDates || [])
      );
      formData.append(
        "pricingPackages",
        JSON.stringify(newPackage.pricingPackages || [])
      );

      // Log the form data being sent
      console.log("📤 FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      // Append images
      if (newPackage.images && newPackage.images.length > 0) {
        newPackage.images.forEach((image) => {
          if (typeof image !== "string") {
            formData.append("images", image);
          }
        });
      }

      const url = editMode
        ? `${API_URL}/api/tours/${currentPackageId}`
        : `${API_URL}/api/tours`;
      const method = editMode ? "PUT" : "POST";
      const token = localStorage.getItem("token");

      console.log("🌐 Sending request to:", url);
      console.log("🔑 Using method:", method);

      const response = await fetch(url, {
        method,
        headers: {
          "x-api-key": process.env.REACT_APP_API_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Server error response:", errorData);
        throw new Error(errorData.message || "Failed to save package");
      }

      await fetchPackages();
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
      id: Math.floor(Math.random() * 9999) + 1, // Generate a random numeric ID between 1 and 10000
      title: "",
      description: "",
      category: "Adventure",
      duration: "",
      location: "",
      inclusions: [],
      exclusions: [],
      itinerary: [],
      availableDates: [],
      pricingPackages: [],
      images: [],
      groupSize: "",
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
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Manage Tour Packages
      </h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <Button variant="custom" onClick={() => setIsModalOpen(true)}>
          Add New Package
        </Button>

        <Button
          variant="outline"
          onClick={handleExportData}
          disabled={exportLoading}>
          {exportLoading ? (
            <div className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></span>
              <span>Exporting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Download Data</span>
            </div>
          )}
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Search Form */}
          <div className="flex-1">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="searchTerm" className="mb-1 block">
                  Search
                </Label>
                <Input
                  id="searchTerm"
                  placeholder="Search by title, description, or location..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full"
                />
              </div>
              <Button type="submit" className="mt-auto">
                Search
              </Button>
            </form>
          </div>

          {/* Category Filter */}
          <div>
            <Label htmlFor="categoryFilter" className="mb-1 block">
              Category
            </Label>
            <Select
              value={categoryFilter}
              onValueChange={handleCategoryFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Adventure">Adventure</SelectItem>
                <SelectItem value="Cultural">Cultural</SelectItem>
                <SelectItem value="Nature">Nature</SelectItem>
                <SelectItem value="Wildlife">Wildlife</SelectItem>
                <SelectItem value="Beach">Beach</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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

      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        Existing Packages
      </h3>
      <Card>
        <Table className="border border-gray-300">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Image</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSortChange("title")}>
                Title {getSortIndicator("title")}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSortChange("duration")}>
                Duration {getSortIndicator("duration")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSortChange("groupSize")}>
                Group Size {getSortIndicator("groupSize")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSortChange("location")}>
                Location {getSortIndicator("location")}
              </TableHead>
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
                <TableCell className="max-w-[300px] truncate">
                  {pkg.description}
                </TableCell>
                <TableCell>{pkg.duration}</TableCell>
                <TableCell>{pkg.groupSize}</TableCell>
                <TableCell>{pkg.location}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      // Handle both old packages with image and new ones with images array
                      const packageImages =
                        pkg.images && pkg.images.length > 0
                          ? pkg.images
                          : pkg.image
                          ? [pkg.image]
                          : [];

                      setNewPackage({
                        _id: pkg._id,
                        id: pkg.id,
                        title: pkg.title,
                        description: pkg.description,
                        category: pkg.category,
                        price: pkg.price ? pkg.price.toString() : "",
                        duration: pkg.duration,
                        groupSize: pkg.groupSize,
                        location: pkg.location,
                        startDate: pkg.startDate
                          ? formatDate(new Date(pkg.startDate))
                          : "",
                        endDate: pkg.endDate
                          ? formatDate(new Date(pkg.endDate))
                          : "",
                        priceOptions: pkg.priceOptions || {},
                        inclusions: pkg.inclusions || [],
                        exclusions: pkg.exclusions || [],
                        itinerary: pkg.itinerary || [],
                        availableDates: pkg.availableDates || [],
                        pricingPackages: pkg.pricingPackages || [],
                        images: packageImages,
                      });
                      setEditMode(true);
                      setCurrentPackageId(pkg._id);
                      setIsModalOpen(true);
                    }}>
                    Edit
                  </Button>

                  <Button
                    variant="ghost"
                    className="text-red-500"
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this package?"
                        )
                      ) {
                        try {
                          const token = localStorage.getItem("token");
                          const response = await fetch(
                            `${API_URL}/api/tours/${pkg._id}`,
                            {
                              method: "DELETE",
                              headers: {
                                "x-api-key": process.env.REACT_APP_API_KEY,
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );
                          if (response.ok) fetchPackages();
                        } catch (error) {
                          console.error("Error deleting package:", error);
                          setError("Failed to delete package");
                        }
                      }
                    }}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}>
              Previous
            </Button>

            <span className="px-4 py-2 border rounded">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}>
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
