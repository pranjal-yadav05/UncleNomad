import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import {
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import { Calendar } from "../components/ui/calendar";

const PackageFormModal = ({
  isOpen,
  onClose,
  newPackage,
  setNewPackage,
  currentDay,
  setCurrentDay,
  handleAddPackage,
  editMode,
  isUploading,
}) => {
  const API_URL = process.env.REACT_APP_API_URL;
  const [editingDayIndex, setEditingDayIndex] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [datePeriods, setDatePeriods] = useState([]);
  const [selectedTab, setSelectedTab] = useState("basic");
  const [currentDatePeriod, setCurrentDatePeriod] = useState({
    startDate: "",
    endDate: "",
    maxGroupSize: "",
    availableSpots: "",
  });
  const [editingDatePeriodIndex, setEditingDatePeriodIndex] = useState(null);
  const [pricingPackages, setPricingPackages] = useState([]);
  const [currentPricingPackage, setCurrentPricingPackage] = useState({
    name: "",
    price: "",
    description: "",
  });
  const [inclusionInput, setInclusionInput] = useState("");
  const [exclusionInput, setExclusionInput] = useState("");

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setImagePreviews([]);
      setImageFiles([]);
    } else if (editMode && newPackage.images) {
      // Set existing images when editing
      setExistingImages(
        newPackage.images.filter((img) => typeof img === "string")
      );
    }
  }, [isOpen, newPackage.images, editMode]);

  useEffect(() => {
    if (isOpen && newPackage) {
      // Initialize date periods from the package data
      if (
        newPackage.availableDates &&
        Array.isArray(newPackage.availableDates)
      ) {
        setDatePeriods(
          newPackage.availableDates.map((period) => ({
            startDate: period.startDate
              ? new Date(period.startDate).toISOString().split("T")[0]
              : "",
            endDate: period.endDate
              ? new Date(period.endDate).toISOString().split("T")[0]
              : "",
            maxGroupSize: period.maxGroupSize || "",
            availableSpots: period.availableSpots || "",
          }))
        );
      } else {
        setDatePeriods([]);
      }

      // Initialize pricing packages
      if (
        newPackage.pricingPackages &&
        Array.isArray(newPackage.pricingPackages)
      ) {
        setPricingPackages(newPackage.pricingPackages);
      } else {
        setPricingPackages([]);
      }
    }
  }, [isOpen, newPackage]);

  useEffect(() => {
    if (isOpen) {
      setNewPackage((prev) => ({
        ...prev,
        availableDates: datePeriods.map((period) => ({
          startDate: period.startDate,
          endDate: period.endDate,
          maxGroupSize: parseInt(period.maxGroupSize) || 0,
          availableSpots: parseInt(period.availableSpots) || 0,
        })),
        pricingPackages: pricingPackages,
      }));
    }
  }, [datePeriods, pricingPackages]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTab("basic");
      setInclusionInput("");
      setExclusionInput("");
      // Reset other local states if needed
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemoveNewImage = (index) => {
    const updatedPreviews = [...imagePreviews];
    const updatedFiles = [...imageFiles];

    // Revoke the object URL to free memory
    URL.revokeObjectURL(updatedPreviews[index].previewUrl);

    updatedPreviews.splice(index, 1);
    updatedFiles.splice(index, 1);

    setImagePreviews(updatedPreviews);
    setImageFiles(updatedFiles);

    setNewPackage({
      ...newPackage,
      images: [...existingImages, ...updatedFiles],
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImageFiles = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImagePreviews((prev) => [...prev, ...newImageFiles]);
    setImageFiles((prev) => [...prev, ...files]);

    setNewPackage({
      ...newPackage,
      images: [...(newPackage.images || []), ...files],
    });
  };

  const handleAddOrUpdateDay = () => {
    if (
      !currentDay.day ||
      !currentDay.title ||
      !currentDay.description ||
      !currentDay.activities ||
      !currentDay.accommodation
    ) {
      alert("Please fill all day fields");
      return;
    }

    const newDay = {
      ...currentDay,
      day: parseInt(currentDay.day), // Ensure day is a number
    };

    if (editingDayIndex !== null) {
      const updatedItinerary = [...newPackage.itinerary];
      updatedItinerary[editingDayIndex] = newDay;
      setNewPackage({ ...newPackage, itinerary: updatedItinerary });
      setEditingDayIndex(null);
    } else {
      setNewPackage({
        ...newPackage,
        itinerary: [...newPackage.itinerary, newDay],
      });
    }

    setCurrentDay({
      day: "",
      title: "",
      description: "",
      activities: "",
      accommodation: "",
    });
  };

  const handleRemoveExistingImage = async (index) => {
    if (!editMode || !existingImages[index]) return;

    const tourId = newPackage._id;
    const imageIndex = index;
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_URL}/api/tours/${tourId}/image/${imageIndex}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove image");
      }

      // Remove image from frontend state if API call succeeds
      const updatedImages = existingImages.filter((_, i) => i !== index);
      setExistingImages(updatedImages);
      setNewPackage({
        ...newPackage,
        images: [...updatedImages, ...imageFiles],
      });
    } catch (error) {
      console.error("❌ Error removing image:", error);
      alert("Failed to remove image. Please try again.");
    }
  };

  const handleCategoryChange = (e) => {
    setNewPackage({ ...newPackage, category: e.target.value });
  };

  const handleAddDatePeriod = () => {
    if (
      !currentDatePeriod.startDate ||
      !currentDatePeriod.endDate ||
      !currentDatePeriod.maxGroupSize
    ) {
      alert("Please fill all date period fields");
      return;
    }

    if (editingDatePeriodIndex !== null) {
      // Update existing date period
      const updatedPeriods = [...datePeriods];
      updatedPeriods[editingDatePeriodIndex] = currentDatePeriod;
      setDatePeriods(updatedPeriods);
      setEditingDatePeriodIndex(null);
    } else {
      // Add new date period
      setDatePeriods([...datePeriods, currentDatePeriod]);
    }

    setCurrentDatePeriod({
      startDate: "",
      endDate: "",
      maxGroupSize: "",
      availableSpots: "",
    });
  };

  const handleEditDatePeriod = (index) => {
    const period = datePeriods[index];
    setCurrentDatePeriod({
      startDate: period.startDate,
      endDate: period.endDate,
      maxGroupSize: period.maxGroupSize,
      availableSpots: period.availableSpots,
    });
    setEditingDatePeriodIndex(index);
  };

  const handleRemoveDatePeriod = (index) => {
    const updatedPeriods = [...datePeriods];
    updatedPeriods.splice(index, 1);
    setDatePeriods(updatedPeriods);
    if (editingDatePeriodIndex === index) {
      setEditingDatePeriodIndex(null);
      setCurrentDatePeriod({
        startDate: "",
        endDate: "",
        maxGroupSize: "",
        availableSpots: "",
      });
    }
  };

  const handleCancelEditDatePeriod = () => {
    setEditingDatePeriodIndex(null);
    setCurrentDatePeriod({
      startDate: "",
      endDate: "",
      maxGroupSize: "",
      availableSpots: "",
    });
  };

  const handleAddPricingPackage = () => {
    if (!currentPricingPackage.name || !currentPricingPackage.price) {
      alert("Please fill all pricing package fields");
      return;
    }

    setPricingPackages([...pricingPackages, currentPricingPackage]);
    setCurrentPricingPackage({
      name: "",
      price: "",
      description: "",
    });
  };

  const handleRemovePricingPackage = (index) => {
    const updatedPackages = [...pricingPackages];
    updatedPackages.splice(index, 1);
    setPricingPackages(updatedPackages);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {editMode ? "Edit Package" : "Add New Package"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700">
              &times;
            </button>
          </div>

          <form onSubmit={handleAddPackage} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="images">Upload Images</Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                multiple
              />

              {/* Existing Images */}
              {editMode && existingImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Existing Images</h4>
                  <div className="flex flex-wrap gap-2">
                    {existingImages.map((url, index) => (
                      <div
                        key={`existing-${index}`}
                        className="relative w-24 h-24">
                        <img
                          src={url}
                          alt="Existing Image"
                          className="w-full h-full object-cover rounded"
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                          onClick={() => handleRemoveExistingImage(index)}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Image Previews */}
              {imagePreviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">New Images</h4>
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((img, index) => (
                      <div key={`new-${index}`} className="relative w-24 h-24">
                        <img
                          src={img.previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover rounded"
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                          onClick={() => handleRemoveNewImage(index)}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Package Fields */}
              <div className="space-y-2">
                <Label htmlFor="id">Package ID</Label>
                <Input
                  id="id"
                  type="number"
                  min="1"
                  value={newPackage.id || ""}
                  onChange={(e) =>
                    setNewPackage({
                      ...newPackage,
                      id: parseInt(e.target.value) || "",
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Package Title</Label>
                <Input
                  id="title"
                  value={newPackage.title || ""}
                  onChange={(e) =>
                    setNewPackage({ ...newPackage, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={newPackage.category || "Adventure"}
                  onChange={handleCategoryChange}
                  className="w-full p-2 border rounded-md bg-white">
                  <option value="Adventure">Adventure</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Relaxation">Relaxation</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inclusions">Inclusions</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {Array.isArray(newPackage.inclusions) &&
                    newPackage.inclusions.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gray-100 rounded-full px-3 py-1 flex items-center gap-1">
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewPackage({
                              ...newPackage,
                              inclusions: newPackage.inclusions.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                          className="text-gray-500 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="inclusionInput"
                    placeholder="Add an inclusion item..."
                    value={inclusionInput || ""}
                    onChange={(e) => setInclusionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inclusionInput.trim()) {
                        e.preventDefault();
                        setNewPackage({
                          ...newPackage,
                          inclusions: [
                            ...(newPackage.inclusions || []),
                            inclusionInput.trim(),
                          ],
                        });
                        setInclusionInput("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (inclusionInput.trim()) {
                        setNewPackage({
                          ...newPackage,
                          inclusions: [
                            ...(newPackage.inclusions || []),
                            inclusionInput.trim(),
                          ],
                        });
                        setInclusionInput("");
                      }
                    }}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exclusions">Exclusions</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {Array.isArray(newPackage.exclusions) &&
                    newPackage.exclusions.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gray-100 rounded-full px-3 py-1 flex items-center gap-1">
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewPackage({
                              ...newPackage,
                              exclusions: newPackage.exclusions.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                          className="text-gray-500 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="exclusionInput"
                    placeholder="Add an exclusion item..."
                    value={exclusionInput || ""}
                    onChange={(e) => setExclusionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && exclusionInput.trim()) {
                        e.preventDefault();
                        setNewPackage({
                          ...newPackage,
                          exclusions: [
                            ...(newPackage.exclusions || []),
                            exclusionInput.trim(),
                          ],
                        });
                        setExclusionInput("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (exclusionInput.trim()) {
                        setNewPackage({
                          ...newPackage,
                          exclusions: [
                            ...(newPackage.exclusions || []),
                            exclusionInput.trim(),
                          ],
                        });
                        setExclusionInput("");
                      }
                    }}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={newPackage.duration || ""}
                  onChange={(e) =>
                    setNewPackage({ ...newPackage, duration: e.target.value })
                  }
                  required
                  placeholder="e.g., 7 Days / 6 Nights"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupSize">Group Size</Label>
                <Input
                  id="groupSize"
                  type="number"
                  value={newPackage.groupSize || ""}
                  onChange={(e) =>
                    setNewPackage({ ...newPackage, groupSize: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newPackage.location || ""}
                  onChange={(e) =>
                    setNewPackage({ ...newPackage, location: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newPackage.description || ""}
                  onChange={(e) =>
                    setNewPackage({
                      ...newPackage,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {/* Itinerary Section */}
              <div className="space-y-2 md:col-span-2">
                <h4 className="font-semibold">Itinerary</h4>
                {newPackage.itinerary && newPackage.itinerary.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {newPackage.itinerary.map((day, index) => (
                      <div key={index} className="p-2 border rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              Day {day.day}: {day.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {day.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentDay(day);
                                setEditingDayIndex(index);
                              }}
                              className="text-blue-500 hover:text-blue-700">
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewPackage((prev) => ({
                                  ...prev,
                                  itinerary: prev.itinerary.filter(
                                    (_, i) => i !== index
                                  ),
                                }));
                              }}
                              className="text-red-500 hover:text-red-700">
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">Day Number</Label>
                    <Input
                      id="day"
                      type="number"
                      value={currentDay.day}
                      onChange={(e) =>
                        setCurrentDay({ ...currentDay, day: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dayTitle">Day Title</Label>
                    <Input
                      id="dayTitle"
                      value={currentDay.title}
                      onChange={(e) =>
                        setCurrentDay({ ...currentDay, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="dayDescription">Day Description</Label>
                    <Input
                      id="dayDescription"
                      value={currentDay.description}
                      onChange={(e) =>
                        setCurrentDay({
                          ...currentDay,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activities">Activities</Label>
                    <Input
                      id="activities"
                      value={currentDay.activities}
                      onChange={(e) =>
                        setCurrentDay({
                          ...currentDay,
                          activities: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accommodation">Accommodation</Label>
                    <Input
                      id="accommodation"
                      value={currentDay.accommodation}
                      onChange={(e) =>
                        setCurrentDay({
                          ...currentDay,
                          accommodation: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Button type="button" onClick={handleAddOrUpdateDay}>
                    {editingDayIndex !== null ? "Update Day" : "Add Day"}
                  </Button>
                  {newPackage.itinerary && newPackage.itinerary.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewPackage((prev) => ({
                          ...prev,
                          itinerary: [],
                        }));
                      }}
                      className="text-sm text-red-500 hover:text-red-700">
                      Clear All Days
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Date Periods Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Available Date Periods</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={currentDatePeriod.startDate}
                    onChange={(e) =>
                      setCurrentDatePeriod({
                        ...currentDatePeriod,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={currentDatePeriod.endDate}
                    onChange={(e) =>
                      setCurrentDatePeriod({
                        ...currentDatePeriod,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGroupSize">Max Group Size</Label>
                  <Input
                    id="maxGroupSize"
                    type="number"
                    value={currentDatePeriod.maxGroupSize}
                    onChange={(e) =>
                      setCurrentDatePeriod({
                        ...currentDatePeriod,
                        maxGroupSize: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availableSpots">Available Spots</Label>
                  <Input
                    id="availableSpots"
                    type="number"
                    value={currentDatePeriod.availableSpots}
                    onChange={(e) =>
                      setCurrentDatePeriod({
                        ...currentDatePeriod,
                        availableSpots: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddDatePeriod}
                  className="flex items-center gap-2">
                  <Plus size={16} />
                  {editingDatePeriodIndex !== null
                    ? "Update Date Period"
                    : "Add Date Period"}
                </Button>
                {editingDatePeriodIndex !== null && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancelEditDatePeriod}>
                    Cancel Edit
                  </Button>
                )}
              </div>

              {/* Display existing date periods */}
              {datePeriods.length > 0 && (
                <div className="mt-4 space-y-2">
                  {datePeriods.map((period, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>
                        {new Date(period.startDate).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "2-digit", year: "numeric" }
                        )}{" "}
                        -{" "}
                        {new Date(period.endDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                        <br />
                        Max Group: {period.maxGroupSize} | Available:{" "}
                        {period.availableSpots}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDatePeriod(index)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDatePeriod(index)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing Packages Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Pricing Packages</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageName">Package Name</Label>
                  <Input
                    id="packageName"
                    value={currentPricingPackage.name}
                    onChange={(e) =>
                      setCurrentPricingPackage({
                        ...currentPricingPackage,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packagePrice">Price (₹)</Label>
                  <Input
                    id="packagePrice"
                    type="number"
                    value={currentPricingPackage.price}
                    onChange={(e) =>
                      setCurrentPricingPackage({
                        ...currentPricingPackage,
                        price: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="packageDescription">Description</Label>
                  <Input
                    id="packageDescription"
                    value={currentPricingPackage.description}
                    onChange={(e) =>
                      setCurrentPricingPackage({
                        ...currentPricingPackage,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddPricingPackage}
                className="flex items-center gap-2">
                <Plus size={16} />
                Add Pricing Package
              </Button>

              {/* Display existing pricing packages */}
              {pricingPackages.length > 0 && (
                <div className="mt-4 space-y-2">
                  {pricingPackages.map((pkg, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>
                        {pkg.name} - ₹{pkg.price}
                        <br />
                        {pkg.description}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePricingPackage(index)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading
                  ? "Uploading..."
                  : editMode
                  ? "Update Package"
                  : "Add Package"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PackageFormModal;
