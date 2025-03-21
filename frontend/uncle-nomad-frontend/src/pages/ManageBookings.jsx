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
    fetchBookings(currentPage);
  }, [currentPage]);

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
      const response = await fetch(
        `${API_URL}/api/bookings?page=${page}&limit=10`,
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-8">
        <Button variant="custom" onClick={openBookingModal}>
          Add New Booking
        </Button>
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
                <TableHead>Guest Name</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Price</TableHead>
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
