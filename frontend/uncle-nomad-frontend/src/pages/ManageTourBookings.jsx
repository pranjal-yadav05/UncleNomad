"use client"

import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import TourBookingFormModal from '../modals/TourBookingFormModal';
import TourBookingDetailsModal from '../modals/TourBookingDetailsModal';

export default function ManageTourBookings() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [bookings, setBookings] = useState([]);
  const [tours, setTours] = useState([]);
  const [newBooking, setNewBooking] = useState({
    tourId: '',
    groupSize: 1,
    bookingDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
    guestName: '',
    email: '',
    phone: '',
    specialRequests: '',
    totalAmount: 0,
    status: 'PENDING',
    paymentStatus: 'PENDING'
  });

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalError, setModalError] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false); // Separate loading for form modal



  useEffect(() => {
    fetchBookings();
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tours`);
      if (!response.ok) throw new Error('Failed to fetch tours');
      const data = await response.json();
      setTours(data);
    } catch (error) {
      console.error('Error fetching tours:', error);
      setError('Failed to fetch tours. Please try again later.');
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      // Using the getAllTourBookings endpoint from tours model
      const response = await fetch(`${API_URL}/api/tours/bookings`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from server');
      }
      
      setBookings(data);
    } catch (error) {
      console.error('Error fetching tour bookings:', error);
      setError('Failed to fetch tour bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBooking = async (bookingId, tourId, status, paymentReference) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/tours/${tourId}/book/${bookingId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status, 
          paymentReference: status === 'CONFIRMED' ? `ADMIN_CONFIRMED_${Date.now()}` : null
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update booking');
      }
  
      setIsModalOpen(false);
      await fetchBookings();
    } catch (error) {
      console.error('Error updating tour booking:', error);
      setError('Failed to update booking. Please try again.');
      setModalError(error.message);
    } finally {
      setLoading(false); // Stop global loading
    }
  };
  

  const handleDeleteBooking = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this booking? This action cannot be undone.");
    if (!confirmDelete) return;
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/tours/booking/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }
      
      await fetchBookings();
    } catch (error) {
      console.error('Error deleting tour booking:', error);
      setModalError(error.message);
      setError('Failed to delete booking. Please try again.');
    }
  };

  const handleVerifyBooking = async (tourId, groupSize, bookingDate) => {
    try {
      const response = await fetch(`${API_URL}/api/tours/${tourId}/verify-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tourId,
          groupSize,
          bookingDate,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify booking');
      }

      return data;
    } catch (error) {
      console.error('Booking verification error:', error);
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
      setError('Please select a tour');
      return;
    }

    // Group size validation
    if (!newBooking.groupSize || newBooking.groupSize <= 0) {
      setError('Invalid group size. Please provide a positive number.');
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
          const response = await fetch(`${API_URL}/api/tours/${newBooking.tourId}/book/${currentBookingId}/confirm`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: newBooking.status,
              paymentReference: newBooking.status === 'CONFIRMED' ? `ADMIN_UPDATED_${Date.now()}` : null
            }),
          });
    
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update booking');
          }
        } else {
          // Create new booking
          const response = await fetch(`${API_URL}/api/tours/${newBooking.tourId}/book`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tourId: newBooking.tourId,
              groupSize: newBooking.groupSize,
              bookingDate: formattedBookingDate,
              guestName: newBooking.guestName,
              email: newBooking.email,
              phone: newBooking.phone,
              specialRequests: newBooking.specialRequests,
              totalAmount: totalAmount
            }),
          });
    
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create booking');
          }
    
          const data = await response.json();
    
          // If admin wants to confirm booking immediately
          if (newBooking.status === 'CONFIRMED') {
            await handleUpdateBooking(
              data.booking.id || data.booking._id,
              newBooking.tourId,
              'CONFIRMED',
              `ADMIN_CONFIRMED_${Date.now()}`
            );
          }
        }
    
      
      fetchBookings();
      setNewBooking({
        tourId: '',
        groupSize: 1,
        bookingDate: new Date().toISOString().split('T')[0],
        guestName: '',
        email: '',
        phone: '',
        specialRequests: '',
        totalAmount: 0,
        status: 'PENDING',
        paymentStatus: 'PENDING'
      });
      
      setEditMode(false);
      setIsModalOpen(false);
      setCurrentBookingId(null);
    } catch (error) {
      console.error('Booking creation/update error:', error);
      setModalError(error.message);
      setError(error.message);
    } finally {
      setFormLoading(false); // Stop global loading
    }
  };

  const handleViewBookingDetails = async (bookingId) => {
    try {
      const response = await fetch(`${API_URL}/api/tours/booking/${bookingId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }
      const data = await response.json();
      setSelectedBooking(data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      
      setError('Failed to fetch booking details. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Tour Bookings</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-8">
        <Button variant='custom' onClick={() => setIsModalOpen(true)}>
          Add New Tour Booking
        </Button>
      </div>

      <TourBookingFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditMode(false);
          setNewBooking({
            tourId: '',
            groupSize: 1,
            bookingDate: new Date().toISOString().split('T')[0],
            guestName: '',
            email: '',
            phone: '',
            specialRequests: '',
            totalAmount: 0,
            status: 'PENDING',
            paymentStatus: 'PENDING'
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
                <TableHead>Guest Name</TableHead>
                <TableHead>Tour</TableHead>
                <TableHead>Booking Date</TableHead>
                <TableHead>Group Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const tourName = tours.find(tour => tour._id === booking.tour)?.title || 'Unknown Tour';
                return (
                  <TableRow key={booking._id} className="hover:bg-gray-50">
                    <TableCell>{booking.guestName}</TableCell>
                    <TableCell>{tourName}</TableCell>
                    <TableCell>{formatDate(booking.bookingDate)}</TableCell>
                    <TableCell>{booking.groupSize}</TableCell>
                    <TableCell className="capitalize">{booking.status}</TableCell>
                    <TableCell className="capitalize">{booking.paymentStatus}</TableCell>
                    <TableCell>₹{booking.totalPrice}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleViewBookingDetails(booking._id)}
                          variant="default"
                          size="sm"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => {
                            setEditMode(true);
                            setCurrentBookingId(booking._id);
                            setNewBooking({
                              tourId: booking.tour,
                              groupSize: booking.groupSize,
                              bookingDate: new Date(booking.bookingDate).toISOString().split('T')[0],
                              guestName: booking.guestName,
                              email: booking.email,
                              phone: booking.phone,
                              specialRequests: booking.specialRequests || '',
                              totalAmount: booking.totalPrice,
                              status: booking.status,
                              paymentStatus: booking.paymentStatus
                            });
                            setIsModalOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteBooking(booking._id)}
                          size="sm"
                          className="bg-red"
                          variant="destructive"
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tour Booking Details Modal */}
      <TourBookingDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        booking={selectedBooking}
        tour={selectedBooking ? tours.find(tour => tour._id === selectedBooking.tour) : null}
      />
    </div>
  );
}