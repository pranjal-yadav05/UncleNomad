"use client"

import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import BookingFormModal from '../modals/BookingFormModal';
import BookingDetailsModal from '../modals/BookingDetailsModal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';


export default function ManageBookings() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({
    rooms: [],
    guestName: '',
    email: '',
    phone: '',
    numberOfGuests: 1,
    numberOfChildren: 0,
    mealIncluded: false,
    extraBeds: 0,
    specialRequests: '',
    checkIn: new Date(),
    checkOut: new Date(),
    totalPrice: 0,
    status: 'pending'
  });

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms`,{ headers: { "x-api-key": process.env.REACT_APP_API_KEY }});
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/bookings`,{headers:{"x-api-key": process.env.REACT_APP_API_KEY}});
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from server');
      }
      
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to fetch bookings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBooking = async (id, status) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json', "x-api-key": process.env.REACT_APP_API_KEY
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update booking');
      }
      setIsModalOpen(false)
      await fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      setError('Failed to update booking. Please try again.');
    }
  };

  const handleDeleteBooking = async (id) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: 'DELETE',
        headers: {"x-api-key": process.env.REACT_APP_API_KEY}
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }
      
      await fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      setError('Failed to delete booking. Please try again.');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (newBooking.checkIn < today) {
      setError('Check-in date cannot be in the past');
      return;
    }
    
    if (newBooking.checkOut <= newBooking.checkIn) {
      setError('Check-out date must be after check-in date');
      return;
    }

    // Room selection validation
    if (newBooking.rooms.length === 0) {
      setError('Please select at least one room');
      return;
    }

    // Calculate total price
    const numberOfNights = Math.ceil(
      (new Date(newBooking.checkOut) - new Date(newBooking.checkIn)) / 
      (1000 * 60 * 60 * 24)
    );
    
    const totalPrice = newBooking.rooms.reduce((sum, room) => {
      const roomPrice = rooms.find(r => r._id === room.roomId)?.price || 0;
      return sum + (roomPrice * numberOfNights * room.quantity);
    }, 0);


    setNewBooking(prev => ({ ...prev, totalPrice }), fetchBookings);



    // Number of guests validation
    if (!newBooking.numberOfGuests || newBooking.numberOfGuests <= 0) {
      setError('Invalid number of guests. Please provide a positive number.');
      return;
    }



    try {
      const url = editMode ? `${API_URL}/api/bookings/${currentBookingId}` : `${API_URL}/api/bookings/book`;
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          "x-api-key": process.env.REACT_APP_API_KEY
        },
        body: JSON.stringify(newBooking),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save booking');
      }
      
      fetchBookings();
      setNewBooking({
        rooms: [],
        guestName: '',
        email: '',
        phone: '',
        numberOfGuests: 1,
        numberOfChildren: 0,
        mealIncluded: false,
        extraBeds: 0,
        specialRequests: '',
        checkIn: new Date(),
        checkOut: new Date(),
        totalPrice: 0,
        status: 'pending'
      });
      
      setEditMode(false);
      setIsModalOpen(false)
      setCurrentBookingId(null);
    } catch (error) {
      console.error('Booking creation error:', error);
      setError(error.message);
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
        <Button variant='custom' onClick={() => setIsModalOpen(true)}>
          Add New Booking
        </Button>
      </div>

      <BookingFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditMode(false);
          setNewBooking({
            rooms: [],
            guestName: '',
            email: '',
            phone: '',
            numberOfGuests: 1,
            numberOfChildren: 0,
            mealIncluded: false,
            extraBeds: 0,
            specialRequests: '',
            checkIn: new Date(),
            checkOut: new Date(),
            totalPrice: 0,
            status: 'pending'
          });
        }}
        newBooking={newBooking}
        setNewBooking={setNewBooking}
        handleBookingSubmit={handleBookingSubmit}
        editMode={editMode}
        rooms={rooms}
      />





      {bookings.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No bookings found.
        </div>
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
                  <TableCell>{new Date(booking.checkIn).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(booking.checkOut).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">{booking.status}</TableCell>
                  <TableCell>₹{booking.totalPrice}</TableCell>
                  <TableCell>
                    <Button 
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Booking Details Modal */}
      <BookingDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        booking={selectedBooking} 
      />
    </div>
  );
}
