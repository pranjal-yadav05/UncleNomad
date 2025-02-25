import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import BookingModal from './BookingModal';
import PaytmPaymentForm from './PaytmPaymentForm';
import BookingConfirmationDialog from './BookingConfirmationDialog';
import CheckingPaymentModal from './CheckingPaymentModal';

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
  const [checking, setChecking] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState(initialBookingForm);
  const [loading, setLoading] = useState(false);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null)

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
          `${process.env.REACT_APP_API_URL}/api/bookings/check-availability?checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}`
        );

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'Failed to check availability');
        }

        const data = await response.json();
        
        // Process availability data from backend
        const availableRooms = data.map(room => ({
          ...room,
          availability: {
            availableBeds: room.type === 'Dorm' ? room.availability.availableBeds : null,
            availableRooms: room.type !== 'Dorm' ? room.availability.availableRooms : null,
            totalBeds: room.type === 'Dorm' ? room.capacity : null,
            totalRooms: room.type !== 'Dorm' ? room.totalRooms : null
          }
        })).filter(room => 
          (room.type === 'Dorm' && room.availability.availableBeds > 0) ||
          (room.type !== 'Dorm' && room.availability.availableRooms > 0)
        );


        if (availableRooms.length === 0) {
          throw new Error('No rooms available for the selected dates');
        }

        console.log('Available rooms:', availableRooms);


        setBookingForm(prev => ({
          ...prev,
          availableRooms,
          step: 2
        }));

      } catch (error) {
        console.error('Error fetching available rooms:', error);
        alert(error.message || 'Failed to check availability. Please try again.');

      } finally {
        setLoading(false);
      }
    } else {
      setDateError('please select valid dates')
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
          className="bg-brand-purple text-white hover:bg-brand-purple/90"
          onClick={checkAvailability}
          disabled={loading}
          id='checkbtn'
        >
          {loading ? "checking..." : "Check Availability"}
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
              setChecking={setChecking}
              bookingForm={bookingForm}
              setBookingForm={setBookingForm}
              isLoading={loading}
              setIsLoading={setLoading}
              availableRooms={bookingForm.availableRooms}
              handleRoomSelection={handleRoomSelection}
              error={error}
              setIsModalOpen={setIsModalOpen}
              setError={setError}
              setIsBookingConfirmed={setIsBookingConfirmed}
              setBookingDetails={setBookingDetails}
              bookingDetails={bookingDetails}
            />
          )}

          {isBookingConfirmed && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <BookingConfirmationDialog
                booking={bookingDetails.booking}
                onClose={() => {
                  setBookingForm(initialBookingForm);
                  setIsBookingConfirmed(false);
                }}
              />
            </div>
          )}


          <CheckingPaymentModal
            open={checking}
          />
          
        </div>
      </div>
    </Card>
  );
}

export default AvailabilitySection;
