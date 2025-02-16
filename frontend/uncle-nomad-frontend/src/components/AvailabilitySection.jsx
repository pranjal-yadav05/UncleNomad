import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import BookingModal from './BookingModal';
import BookingConfirmationDialog from './BookingConfirmationDialog';

const initialBookingForm = {
  step: 1,
  selectedRooms: {},
  guestName: '',
  email: '',
  phone: '',
  numberOfGuests: 1,
  numberOfChildren: 0,
  mealIncluded: false,
  extraBeds: 0,
  specialRequests: '',
  checkIn: null,
  checkOut: null,
  availableRooms: [],
  bookingDetails: null
};

function AvailabilitySection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState(initialBookingForm);
  const [loading, setLoading] = useState(false);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    
    setBookingForm(prev => ({
      ...prev,
      [name]: new Date(value)
    }));
  };

  const handleRoomSelection = (roomId, count) => {
    setBookingForm(prev => ({
      ...prev,
      selectedRooms: {
        ...prev.selectedRooms,
        [roomId]: count
      }
    }));
  };

  const checkAvailability = async () => {
    const { checkIn, checkOut } = bookingForm;
    if (checkIn && checkOut) {
      setDateError('')
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/rooms/availability?checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}`
        );

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'Failed to check availability');
        }

        const data = await response.json();
        setBookingForm(prev => ({
          ...prev,
          availableRooms: data,
          step: 2
        }));
      } catch (error) {
        console.error('Error fetching available rooms:', error);
        alert('Failed to check availability. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setDateError('please select valid dates')
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const [roomId, quantity] = Object.entries(bookingForm.selectedRooms)[0];
      console.log('room id : ', roomId);
      const selectedRoom = bookingForm.availableRooms.find(room => 
        room._id && room._id.toString() === roomId.toString()
      );

      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const bookingData = {
        roomId: selectedRoom?._id || roomId,
        quantity: quantity,
        guestName: bookingForm.guestName,
        email: bookingForm.email,
        phone: bookingForm.phone,
        numberOfGuests: bookingForm.numberOfGuests,
        numberOfChildren: bookingForm.numberOfChildren,
        mealIncluded: bookingForm.mealIncluded,
        extraBeds: bookingForm.extraBeds,
        specialRequests: bookingForm.specialRequests,
        checkIn: formatDate(bookingForm.checkIn),
        checkOut: formatDate(bookingForm.checkOut),
        totalPrice: selectedRoom?.price * Math.ceil((new Date(bookingForm.checkOut) - new Date(bookingForm.checkIn)) / (1000 * 60 * 60 * 24)) || 0
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/rooms/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Failed to process booking';
        throw new Error(errorMessage);
      }


      const bookingResponse = await response.json();
      console.log('-----')
      console.log(bookingResponse.booking)
      console.log('----')
      const bookingDetails = {
        id: bookingResponse._id,
        roomType: selectedRoom?.type || 'Room',
        checkIn: bookingResponse.booking.checkIn,
        checkOut: bookingResponse.booking.checkOut,
        totalPrice: bookingResponse.booking.totalPrice
      };

      setBookingForm(prev => ({
        ...prev,
        bookingDetails,
        step: 4
      }));

      setIsBookingConfirmed(true);
      setError('')
      setIsModalOpen(false);

    } catch (error) {
      console.error('Booking error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {

      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <div className="mb-8">
        <p className="text-gray-600">Select your dates to check room availability</p>
      </div>

      <div className="flex flex-col gap_4 max-w-md mx-auto">
        {dateError !== '' && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
              <div>{dateError}</div>
            </div>
          )}
        <div className="flex gap-4">
          
          <div className="flex-1 mb-4">
            <label htmlFor="checkIn" className="block text-sm font-medium mb-1">
              Check-in
            </label>
            <input
              type="date"
              id="checkIn"
              name="checkIn"
              value={bookingForm.checkIn?.toISOString().split('T')[0] || ''}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div className="flex-1">
            <label htmlFor="checkOut" className="block text-sm font-medium mb-1">
              Check-out
            </label>
            <input
              type="date"
              id="checkOut"
              name="checkOut"
              value={bookingForm.checkOut?.toISOString().split('T')[0] || ''}
              onChange={handleDateChange}
              min={bookingForm.checkIn?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
        </div>
        
        <Button 
          variant="custom" 
          className="bg-brand-purple hover:bg-brand-purple/90"
          onClick={checkAvailability}
        >
          Check Availability
        </Button>
      </div>
    </>
  );

  useEffect(() => {
    if (bookingForm.step === 2) {
      setIsModalOpen(true);
    }
  }, [bookingForm.step]);

  const renderStep2 = () => null;

  return (
    <Card className="py-12 bg-gray-50" id="availability">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Check Availability</h2>
          {bookingForm.step === 1 && renderStep1()}
          {bookingForm.step === 2 && renderStep2()}
          {bookingForm.step >= 2 && (
            <BookingModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false); 
                setError(''); 
                setBookingForm(prev => ({
                  ...prev,
                  step: 1
                }));}}
              bookingForm={bookingForm}
              setBookingForm={setBookingForm}
              handleBookingSubmit={handleBookingSubmit}
              isLoading={loading}
              availableRooms={bookingForm.availableRooms}
              handleRoomSelection={handleRoomSelection}
              error={error}
              setError={setError}
            />
          )}

          {isBookingConfirmed && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <BookingConfirmationDialog
                bookingDetails={bookingForm.bookingDetails}
                onClose={() => {
                  setBookingForm(initialBookingForm);
                  setIsBookingConfirmed(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default AvailabilitySection;
