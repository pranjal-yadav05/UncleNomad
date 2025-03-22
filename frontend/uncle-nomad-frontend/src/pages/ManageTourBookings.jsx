"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import TourBookingFormModal from "../modals/TourBookingFormModal";
import TourBookingDetailsModal from "../modals/TourBookingDetailsModal";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { formatDate } from "../utils/dateUtils";

export default function ManageTourBookings() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [bookings, setBookings] = useState([]);
  const [tours, setTours] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");

  const [newBooking, setNewBooking] = useState({
    tourId: "",
    groupSize: 1,
    bookingDate: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
    guestName: "",
    email: "",
    phone: "",
    specialRequests: "",
    totalAmount: 0,
    status: "PENDING",
    paymentStatus: "PENDING",
  });

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false); // Separate loading for form modal

  useEffect(() => {
    fetchBookings(currentPage);
    fetchTours();
  }, [currentPage, sortField, sortOrder, statusFilter]);

  const fetchTours = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tours`, {
        headers: { "x-api-key": process.env.REACT_APP_API_KEY },
      });
      if (!response.ok) throw new Error("Failed to fetch tours");
      const data = await response.json();

      // Check if data has a tours property (new API format) or if it's an array directly (old format)
      const toursArray = data.tours || data;
      setTours(Array.isArray(toursArray) ? toursArray : []);
    } catch (error) {
      console.error("Error fetching tours:", error);
      setError("Failed to fetch tours. Please try again later.");
      setTours([]); // Set to empty array on error
    }
  };

  const fetchBookings = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");

      // Build query parameters
      const params = new URLSearchParams({
        page,
        limit: 10,
        sort: `${sortOrder === "desc" ? "-" : ""}${sortField}`,
      });

      // Add status filter if not 'all'
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      // Add search term if present
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const response = await fetch(
        `${API_URL}/api/tours/bookings?${params.toString()}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.bookings)) {
        throw new Error("Invalid data format received from server");
      }
      console.log("bookings", data.bookings);
      setBookings(data.bookings);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error fetching tour bookings:", error);
      setError("Failed to fetch tour bookings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBooking = async (
    bookingId,
    tourId,
    status,
    paymentReference
  ) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/tours/${tourId}/book/${bookingId}/confirm`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            paymentReference:
              status === "CONFIRMED" ? `ADMIN_CONFIRMED_${Date.now()}` : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update booking");
      }

      setIsModalOpen(false);
      await fetchBookings();
    } catch (error) {
      console.error("Error updating tour booking:", error);
      setError("Failed to update booking. Please try again.");
      setModalError(error.message);
    } finally {
      setLoading(false); // Stop global loading
    }
  };

  const handleDeleteBooking = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this booking? This action cannot be undone."
    );
    if (!confirmDelete) return;
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/tours/booking/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.REACT_APP_API_KEY,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete booking");
      }

      await fetchBookings();
    } catch (error) {
      console.error("Error deleting tour booking:", error);
      setModalError(error.message);
      setError("Failed to delete booking. Please try again.");
    }
  };

  const handleVerifyBooking = async (tourId, groupSize, bookingDate) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/tours/${tourId}/verify-booking`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tourId,
            groupSize,
            bookingDate,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to verify booking");
      }

      return data;
    } catch (error) {
      console.error("Booking verification error:", error);
      setModalError(error.message);
      setError(error.message);
      return null;
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tour selection validation
    if (!newBooking.tourId) {
      setError("Please select a tour");
      return;
    }

    // Group size validation
    if (!newBooking.groupSize || newBooking.groupSize <= 0) {
      setError("Invalid group size. Please provide a positive number.");
      return;
    }

    // Verify booking availability first
    const verificationResult = await handleVerifyBooking(
      newBooking.tourId,
      newBooking.groupSize,
      newBooking.bookingDate
    );

    if (!verificationResult) return;

    // Use the verified total price
    const totalAmount = verificationResult.totalPrice;
    const formattedBookingDate = new Date(newBooking.bookingDate).toISOString();

    try {
      if (editMode && currentBookingId) {
        // Update existing booking
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_URL}/api/tours/${newBooking.tourId}/book/${currentBookingId}/confirm`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.REACT_APP_API_KEY,
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: newBooking.status,
              paymentReference:
                newBooking.status === "CONFIRMED"
                  ? `ADMIN_UPDATED_${Date.now()}`
                  : null,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update booking");
        }
      } else {
        // Create new booking
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_URL}/api/tours/${newBooking.tourId}/book`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.REACT_APP_API_KEY,
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              tourId: newBooking.tourId,
              groupSize: newBooking.groupSize,
              bookingDate: formattedBookingDate,
              guestName: newBooking.guestName,
              email: newBooking.email,
              phone: newBooking.phone,
              specialRequests: newBooking.specialRequests,
              totalAmount: totalAmount,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create booking");
        }

        const data = await response.json();

        // If admin wants to confirm booking immediately
        if (newBooking.status === "CONFIRMED") {
          await handleUpdateBooking(
            data.booking.id || data.booking._id,
            newBooking.tourId,
            "CONFIRMED",
            `ADMIN_CONFIRMED_${Date.now()}`
          );
        }
      }

      fetchBookings();
      setNewBooking({
        tourId: "",
        groupSize: 1,
        bookingDate: new Date().toISOString().split("T")[0],
        guestName: "",
        email: "",
        phone: "",
        specialRequests: "",
        totalAmount: 0,
        status: "PENDING",
        paymentStatus: "PENDING",
      });

      setEditMode(false);
      setIsModalOpen(false);
      setCurrentBookingId(null);
    } catch (error) {
      console.error("Booking creation/update error:", error);
      setModalError(error.message);
      setError(error.message);
    } finally {
      setFormLoading(false); // Stop global loading
    }
  };

  const handleViewBookingDetails = async (bookingId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/tours/booking/${bookingId}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch booking details");
      }
      const data = await response.json();
      setSelectedBooking(data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error("Error fetching booking details:", error);

      setError("Failed to fetch booking details. Please try again.");
    }
  };

  // Function to handle exporting tour bookings to Excel
  const handleExportToExcel = async () => {
    try {
      if (!fromDate || !toDate) {
        setError("Please select both from and to dates for export");
        return;
      }

      setExportLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/tours/bookings/export?fromDate=${fromDate}&toDate=${toDate}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        // Handle the "no bookings found" case specifically
        setError("No tour bookings found in the selected date range");
        setExportLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to export tour bookings");
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to download the file
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `tour_bookings_${fromDate}_to_${toDate}.xlsx`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportLoading(false);
    } catch (error) {
      console.error("Error exporting tour bookings:", error);
      setError("Failed to export tour bookings. Please try again.");
      setExportLoading(false);
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
    fetchBookings(1);
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

  // Handle status filter change
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page
  };

  // Function to handle downloading all data as Excel
  const handleDownloadAllData = async () => {
    try {
      setExportLoading(true);
      const token = localStorage.getItem("token");

      // Build query parameters for filtered/sorted data
      const params = new URLSearchParams({
        sort: `${sortOrder === "desc" ? "-" : ""}${sortField}`,
      });

      // Add status filter if not 'all'
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      // Add search term if present
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const response = await fetch(
        `${API_URL}/api/tours/bookings/export/all?${params.toString()}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        setError("No tour bookings found with the current filters");
        setExportLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to export tour bookings");
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
        : `tour_bookings_export_${today}.xlsx`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportLoading(false);
    } catch (error) {
      console.error("Error exporting all tour bookings:", error);
      setError("Failed to export tour bookings. Please try again.");
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Manage Tour Bookings</h2>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading tour bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Manage Tour Bookings
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Button variant="custom" onClick={() => setIsModalOpen(true)}>
          Add New Tour Booking
        </Button>

        <Button
          variant="outline"
          onClick={handleDownloadAllData}
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
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
          {/* Search Form */}
          <div className="flex-1">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="searchTerm" className="mb-1 block">
                  Search
                </Label>
                <Input
                  id="searchTerm"
                  placeholder="Search by name, email, or phone..."
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

          {/* Status Filter */}
          <div>
            <Label htmlFor="statusFilter" className="mb-1 block">
              Status
            </Label>
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Export Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div>
              <Button
                onClick={handleExportToExcel}
                disabled={exportLoading || !fromDate || !toDate}
                className="w-full">
                {exportLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                    <span>Exporting...</span>
                  </div>
                ) : (
                  "Export Date Range"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <TourBookingFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditMode(false);
          setNewBooking({
            tourId: "",
            groupSize: 1,
            bookingDate: new Date().toISOString().split("T")[0],
            guestName: "",
            email: "",
            phone: "",
            specialRequests: "",
            totalAmount: 0,
            status: "PENDING",
            paymentStatus: "PENDING",
          });
        }}
        newBooking={newBooking}
        setNewBooking={setNewBooking}
        handleBookingSubmit={handleBookingSubmit}
        editMode={editMode}
        tours={tours}
        verifyBooking={handleVerifyBooking}
        modalError={modalError}
        formLoading={formLoading}
      />

      {bookings.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No tour bookings found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="border border-gray-300">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSortChange("guestName")}>
                  Guest Name {getSortIndicator("guestName")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSortChange("tour")}>
                  Tour {getSortIndicator("tour")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSortChange("bookingDate")}>
                  Booking Date {getSortIndicator("bookingDate")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSortChange("groupSize")}>
                  Group Size {getSortIndicator("groupSize")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSortChange("status")}>
                  Status {getSortIndicator("status")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSortChange("paymentStatus")}>
                  Payment Status {getSortIndicator("paymentStatus")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSortChange("totalPrice")}>
                  Total Price {getSortIndicator("totalPrice")}
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                // Safely find tour by checking if tours is an array first
                const tourName = Array.isArray(tours)
                  ? tours.find(
                      (tour) => tour._id === (booking.tour?._id || booking.tour)
                    )?.title || "Unknown Tour"
                  : "Unknown Tour";

                return (
                  <TableRow key={booking._id} className="hover:bg-gray-50">
                    <TableCell>{booking.guestName}</TableCell>
                    <TableCell>{tourName}</TableCell>
                    <TableCell>{formatDate(booking.bookingDate)}</TableCell>
                    <TableCell>{booking.groupSize}</TableCell>
                    <TableCell className="capitalize">
                      {booking.status}
                    </TableCell>
                    <TableCell className="capitalize">
                      {booking.paymentStatus}
                    </TableCell>
                    <TableCell>₹{booking.totalPrice}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleViewBookingDetails(booking._id)}
                          variant="outline"
                          size="sm">
                          View
                        </Button>
                        <Button
                          onClick={() => {
                            setEditMode(true);
                            setCurrentBookingId(booking._id);
                            setNewBooking({
                              tourId: booking.tour._id || booking.tour,
                              groupSize: booking.groupSize,
                              bookingDate: booking.bookingDate,
                              guestName: booking.guestName,
                              email: booking.email,
                              phone: booking.phone,
                              specialRequests: booking.specialRequests || "",
                              totalAmount: booking.totalPrice,
                              status: booking.status,
                              paymentStatus: booking.paymentStatus,
                            });
                            setIsModalOpen(true);
                          }}
                          variant="outline"
                          size="sm">
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteBooking(booking._id)}
                          size="sm"
                          className="bg-red"
                          variant="destructive"
                          disabled={loading}>
                          {loading ? "Processing..." : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
        </div>
      )}

      {/* Tour Booking Details Modal */}
      <TourBookingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        booking={selectedBooking}
        tour={
          selectedBooking && Array.isArray(tours)
            ? tours.find(
                (tour) =>
                  tour._id ===
                  (selectedBooking.tour?._id || selectedBooking.tour)
              ) || null
            : null
        }
      />
    </div>
  );
}
