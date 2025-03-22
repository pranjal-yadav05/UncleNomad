"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import BookingFormModal from "../modals/BookingFormModal";
import BookingDetailsModal from "../modals/BookingDetailsModal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";

export default function ManageBookings() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({
    rooms: [],
    guestName: "",
    email: "",
    phone: "",
    numberOfGuests: 1,
    numberOfChildren: 0,
    mealIncluded: false,
    extraBeds: 0,
    specialRequests: "",
    checkIn: new Date(),
    checkOut: new Date(),
    totalPrice: 0,
    status: "pending",
  });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Handle browser back button to close modals
  useEffect(() => {
    const handlePopState = (event) => {
      if (isModalOpen) {
        closeBookingModal();
        // Prevent default behavior to avoid actual navigation
        event.preventDefault();
      }
      if (isDetailsModalOpen) {
        closeDetailsModal();
        // Prevent default behavior to avoid actual navigation
        event.preventDefault();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isModalOpen, isDetailsModalOpen]);

  // Add history state when opening modals
  const openBookingModal = () => {
    setModalError("");
    setIsModalOpen(true);
    // Add a history entry when opening the modal
    window.history.pushState({ modal: "booking" }, "");
  };

  const closeBookingModal = () => {
    setIsModalOpen(false);
    setEditMode(false);
    setModalError("");
    setNewBooking({
      rooms: [],
      guestName: "",
      email: "",
      phone: "",
      numberOfGuests: 1,
      numberOfChildren: 0,
      mealIncluded: false,
      extraBeds: 0,
      specialRequests: "",
      checkIn: new Date(),
      checkOut: new Date(),
      totalPrice: 0,
      status: "pending",
    });
  };

  const openDetailsModal = (booking) => {
    setSelectedBooking(booking);
    setIsDetailsModalOpen(true);
    // Add a history entry when opening the details modal
    window.history.pushState({ modal: "details" }, "");
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);
  useEffect(() => {
    fetchBookings(currentPage);
  }, [currentPage, sortField, sortOrder, statusFilter]);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/rooms`, {
        headers: {
          "x-api-key": process.env.REACT_APP_API_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch rooms");
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const fetchBookings = async (page = 1) => {
    setIsLoading(true);
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
        `${API_URL}/api/bookings?${params.toString()}`,
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

      setBookings(data.bookings);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Failed to fetch bookings. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBooking = async (id, status) => {
    setModalError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update booking");
      }
      closeBookingModal();
      await fetchBookings();
    } catch (error) {
      console.error("Error updating booking:", error);
      setModalError("Failed to update booking. Please try again.");
    }
  };

  const handleDeleteBooking = async (id) => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/bookings/${id}`, {
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
      console.error("Error deleting booking:", error);
      setError("Failed to delete booking. Please try again.");
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setModalError("");

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newBooking.checkIn < today) {
      setModalError("Check-in date cannot be in the past");
      return;
    }

    if (newBooking.checkOut <= newBooking.checkIn) {
      setModalError("Check-out date must be after check-in date");
      return;
    }

    // Room selection validation
    if (newBooking.rooms.length === 0) {
      setModalError("Please select at least one room");
      return;
    }

    // Calculate total price
    const numberOfNights = Math.ceil(
      (new Date(newBooking.checkOut) - new Date(newBooking.checkIn)) /
        (1000 * 60 * 60 * 24)
    );

    const totalPrice = newBooking.rooms.reduce((sum, room) => {
      const roomPrice = rooms.find((r) => r._id === room.roomId)?.price || 0;
      return sum + roomPrice * numberOfNights * room.quantity;
    }, 0);

    setNewBooking((prev) => ({ ...prev, totalPrice }));

    // Number of guests validation
    if (!newBooking.numberOfGuests || newBooking.numberOfGuests <= 0) {
      setModalError(
        "Invalid number of guests. Please provide a positive number."
      );
      return;
    }

    try {
      const url = editMode
        ? `${API_URL}/api/bookings/${currentBookingId}`
        : `${API_URL}/api/bookings/book`;
      const method = editMode ? "PUT" : "POST";
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newBooking),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save booking");
      }

      fetchBookings();
      setNewBooking({
        rooms: [],
        guestName: "",
        email: "",
        phone: "",
        numberOfGuests: 1,
        numberOfChildren: 0,
        mealIncluded: false,
        extraBeds: 0,
        specialRequests: "",
        checkIn: new Date(),
        checkOut: new Date(),
        totalPrice: 0,
        status: "pending",
      });

      setEditMode(false);
      closeBookingModal();
      // When successful, go back in history to remove the modal state
      if (window.history.state?.modal === "booking") {
        window.history.back();
      }
      setCurrentBookingId(null);
    } catch (error) {
      console.error("Booking creation error:", error);
      setModalError(error.message);
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

  // Function to handle exporting bookings to Excel
  const handleExportToExcel = async () => {
    try {
      if (!fromDate || !toDate) {
        setError("Please select both from and to dates for export");
        return;
      }

      setExportLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/bookings/export?fromDate=${fromDate}&toDate=${toDate}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        // Handle the "no bookings found" case specifically
        setError("No bookings found in the selected date range");
        setExportLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to export bookings");
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
        : `bookings_${fromDate}_to_${toDate}.xlsx`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportLoading(false);
    } catch (error) {
      console.error("Error exporting bookings:", error);
      setError("Failed to export bookings. Please try again.");
      setExportLoading(false);
    }
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
        `${API_URL}/api/bookings/export/all?${params.toString()}`,
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        setError("No bookings found with the current filters");
        setExportLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to export bookings");
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
        : `bookings_export_${today}.xlsx`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportLoading(false);
    } catch (error) {
      console.error("Error exporting all bookings:", error);
      setError("Failed to export bookings. Please try again.");
      setExportLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Manage Bookings</h2>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Bookings</h2>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Button variant="custom" onClick={openBookingModal}>
          Add New Booking
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

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
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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

      <BookingFormModal
        isOpen={isModalOpen}
        onClose={() => {
          closeBookingModal();
          // When manually closing, go back in history to remove the modal state
          if (window.history.state?.modal === "booking") {
            window.history.back();
          }
        }}
        newBooking={newBooking}
        setNewBooking={setNewBooking}
        handleBookingSubmit={handleBookingSubmit}
        editMode={editMode}
        rooms={rooms}
        modalError={modalError}
      />

      {bookings.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No bookings found.</div>
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
                  onClick={() => handleSortChange("checkIn")}>
                  Check-in {getSortIndicator("checkIn")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSortChange("checkOut")}>
                  Check-out {getSortIndicator("checkOut")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSortChange("status")}>
                  Status {getSortIndicator("status")}
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
              {bookings.map((booking) => (
                <TableRow key={booking._id} className="hover:bg-gray-50">
                  <TableCell>{booking.guestName}</TableCell>
                  <TableCell>
                    {new Date(booking.checkIn).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(booking.checkOut).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="capitalize">{booking.status}</TableCell>
                  <TableCell>₹{booking.totalPrice}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => openDetailsModal(booking)}
                        variant="outline"
                        size="sm">
                        View Details
                      </Button>
                      <Button
                        onClick={() => {
                          setNewBooking({
                            ...booking,
                            checkIn: new Date(booking.checkIn),
                            checkOut: new Date(booking.checkOut),
                          });
                          setEditMode(true);
                          setCurrentBookingId(booking._id);
                          openBookingModal();
                        }}
                        variant="outline"
                        size="sm">
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this booking?"
                            )
                          ) {
                            handleDeleteBooking(booking._id);
                          }
                        }}
                        variant="destructive"
                        size="sm">
                        Delete
                      </Button>
                    </div>
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
        </div>
      )}

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          closeDetailsModal();
          // When manually closing, go back in history to remove the modal state
          if (window.history.state?.modal === "details") {
            window.history.back();
          }
        }}
        booking={selectedBooking}
        onUpdateStatus={handleUpdateBooking}
        onDelete={(id) => {
          if (window.confirm("Are you sure you want to delete this booking?")) {
            handleDeleteBooking(id);
            closeDetailsModal();
          }
        }}
      />
    </div>
  );
}
