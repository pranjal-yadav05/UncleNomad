import { useState, useEffect, useCallback } from 'react'
import PaymentModal from './PaymentModal'
import { format } from 'date-fns'
import { CalendarDaysIcon, UserIcon, HomeIcon } from '@heroicons/react/24/outline'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

export default function BookingModal({
  isOpen,
  onClose,
  bookingForm,
  setBookingForm,
  isLoading,
  setIsLoading,
  setChecking,
  availableRooms,
  handleRoomSelection,
  error,
  setError,
  setIsModalOpen,
  setIsBookingConfirmed,
  setBookingDetails,
  bookingDetails
}) {
  const [paymentData, setPaymentData] = useState(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const [step, setStep] = useState(0)
  const [validationErrors, setValidationErrors] = useState({})
  const [showError, setShowError] = useState(true)

  const selectedRoom = availableRooms.find(room => room._id === Object.keys(bookingForm.selectedRooms)[0])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }))

    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleNumberChange = (e) => {
    const { name, value } = e.target
    const numValue = Number(value)
    
    // Validate number fields
    if (name === 'numberOfGuests' && (numValue < 1 || isNaN(numValue))) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: 'At least 1 guest is required'
      }))
    } else {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    setBookingForm(prev => ({
      ...prev,
      [name]: numValue
    }))
  }

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setBookingForm(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const validateStep0 = () => {
    const totalCapacity = availableRooms.reduce((sum, room) => {
      const isDorm = room.type.toLowerCase() === 'dorm';
      const currentCount = bookingForm.selectedRooms[room._id] || 0;
      return sum + (isDorm ? currentCount : room.capacity * currentCount);
    }, 0);

    if (bookingForm.numberOfGuests > totalCapacity) {
      setError(`Selected rooms can only accommodate ${totalCapacity} guests. You requested for ${bookingForm.numberOfGuests} guests.`);
      return false;
    }
    return true;
  }

  const renderStep0 = () => (
    <div className="spacey-4">
      <h3 className="text-lg font-semibold">Select Rooms</h3>
      {error && (
        <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
          <div className="font-medium">Booking Error</div>
          <div>{error}</div>
          <button 
            onClick={() => setError('')}
            className="mt-2 text-sm text-red-600 underline hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}
  
      {availableRooms.map(room => {
        const isDorm = room.type.toLowerCase() === 'dorm';
        const currentCount = bookingForm.selectedRooms[room._id] || 0;
        const remainingCapacity = isDorm ? 
          room.availability.availableBeds - currentCount : 
          room.availability.availableRooms - currentCount;
  
        return (
          <div key={room._id} className="border p-4 rounded-lg flex gap-4">
            {/* Image Section */}
            <div className="w-24 h-24 flex-shrink-0">
              <img 
                src={room.imageUrl} 
                alt="room-image" 
                className="w-full h-full object-cover rounded-md"
              />
            </div>
  
            {/* Room Details */}
            <div className="flex-1">
              <h4 className="font-medium">
                {isDorm ? 'Dorm Bed' : `${room.type} Room`}
              </h4>
              <p className="text-sm text-gray-500">
                ₹{room.price}/night {isDorm && '(per bed)'}
              </p>
              {isDorm ? (
                <p className="text-sm text-gray-500">
                  Shared Room - {room.availability.availableBeds} bed{room.availability.availableBeds !== 1 ? 's' : ''} available
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Private Room - {room.availability.availableRooms} room{room.availability.availableRooms !== 1 ? 's' : ''} available
                </p>
              )}
            </div>
  
            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (currentCount > 0) {
                    handleRoomSelection(room._id, currentCount - 1);
                  }
                }}
                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                disabled={currentCount <= 0}
              >
                -
              </button>
              <span>{currentCount}</span>
              <button 
                onClick={() => {
                  const maxAvailable = isDorm ? 
                    room.availability.availableBeds : 
                    room.availability.availableRooms;
                  if (currentCount < maxAvailable) {
                    handleRoomSelection(room._id, currentCount + 1);
                  }
                }}
                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                disabled={currentCount >= (isDorm ? 
                  room.availability.availableBeds : 
                  room.availability.availableRooms)}
              >
                +
              </button>
            </div>
          </div>
        );
      })}
      
      <Button
        onClick={() => {
          if (validateStep0()) {
            setStep(1);
            setError('');
          }
        }}
        variant='custom'
        className="w-full mt-2 mb-2 text-white bg-brand-purple hover:bg-brand-purple/90"
        disabled={Object.keys(bookingForm.selectedRooms).length === 0}
      >
        Next
      </Button>
  
      <p className="text-sm text-gray-500 mt-2">
        Note: When booking dorm beds, you're reserving individual beds in a shared space. 
        Private rooms are booked as complete units.
      </p>
    </div>
  );
  

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="guestName">Full Name</Label>
        <Input
          id="guestName"
          name="guestName"
          value={bookingForm.guestName}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={bookingForm.email}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={bookingForm.phone}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => setStep(0)}
          variant="outline"
          className="w-full"
        >
          Back
        </Button>

        <Button
          onClick={() => setStep(2)}
          variant='custom'
          className="w-full text-white  bg-brand-purple hover:bg-brand-purple/90"
          disabled={!bookingForm.guestName || !bookingForm.email || !bookingForm.phone}
        >
          Next
        </Button>
      </div>
    </div>
  )

  const validateStep2 = () => {
    const errors = {}
    
    if (!bookingForm.numberOfGuests || bookingForm.numberOfGuests < 1) {
      errors.numberOfGuests = "At least one guest is required"
    }
    if (!bookingForm.guestName) {
      errors.guestName = "Guest name is required"
    }
    if (!bookingForm.email) {
      errors.email = "Email is required"
    }
    if (!bookingForm.phone) {
      errors.phone = "Phone number is required"
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleStep2Submit = async (e) => {
    e.preventDefault()
    if (validateStep2()) {
      try {
        setIsLoading(true)



        // Calculate total amount
        const totalAmount = availableRooms.reduce((sum, room) => {
          const count = bookingForm.selectedRooms[room._id] || 0
          return sum + room.price * count
        }, 0)

        // Prepare booking data
        const bookingData = {
          ...bookingForm,
          totalAmount,
          rooms: Object.entries(bookingForm.selectedRooms).map(([roomId, quantity]) => ({
            roomId,
            quantity,
            checkIn: bookingForm.checkIn,
            checkOut: bookingForm.checkOut,
          })),
        }

        setBookingForm(bookingData)

        console.log("Sending booking data:", JSON.stringify(bookingData, null, 2))


        // const verifyResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings/verify`, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify(bookingData),
        // });
  
        // if (!verifyResponse.ok) {
        //   const errorData = await verifyResponse.json();
        //   setShowError(true)
        //   setError(errorData.message)
        //   throw new Error(errorData.message || 'Booking verification failed');
        // }

        // Initiate payment first

        console.log("Initiating payment request to:", `${process.env.REACT_APP_API_URL}/api/payments/initiate`);
        const paymentResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/initiate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include', // Include cookies for session
          body: JSON.stringify({
            bookingData: bookingData,
            amount: totalAmount,
            customerId: bookingForm.email,
            email: bookingForm.email,
            phone: bookingForm.phone,
          }),
        })
        
        console.log("Payment response status:", paymentResponse.status);


        if (!paymentResponse.ok) {
          console.error("Payment initiation failed with status:", paymentResponse.status);
          let errorData;
          try {
            errorData = await paymentResponse.json();
            console.error("Payment error details:", errorData);
          } catch (jsonError) {
            console.error("Failed to parse error response:", jsonError);
            throw new Error("Failed to initialize payment: Invalid server response");
          }
          throw new Error(errorData.message || "Failed to initialize payment");
        }


        const paymentData = await paymentResponse.json()

        if (paymentData.status === "SUCCESS" && paymentData.data) {
          console.log("Payment data received:", paymentData.data)
          setPaymentData(paymentData.data)
          setIsPaymentModalOpen(true)

          
          console.log("Payment modal opened with data:", paymentData.data)

        } else {
          throw new Error("Payment initialization failed")
        }
      } catch (error) {
        console.error("Booking/Payment Error:", error)
        setError("Failed to process booking: " + error.message)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="numberOfGuests">Number of Guests *</Label>
        <Input
          id="numberOfGuests"
          name="numberOfGuests"
          type="number"
          min="1"
          value={bookingForm.numberOfGuests}
          onChange={handleNumberChange}
          required
          className={validationErrors.numberOfGuests ? 'border-red-500' : ''}
        />
        {validationErrors.numberOfGuests && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.numberOfGuests}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="numberOfChildren">Number of Children</Label>
        <Input
          id="numberOfChildren"
          name="numberOfChildren"
          type="number"
          min="0"
          value={bookingForm.numberOfChildren}
          onChange={handleNumberChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="extraBeds">Extra Beds</Label>
        <Input
          id="extraBeds"
          name="extraBeds"
          type="number"
          min="0"
          value={bookingForm.extraBeds}
          onChange={handleNumberChange}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="mealIncluded"
          name="mealIncluded"
          type="checkbox"
          checked={bookingForm.mealIncluded}
          onChange={handleCheckboxChange}
          className="h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
        />
        <Label htmlFor="mealIncluded">Include Meals</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequests">Special Requests</Label>
        <textarea
          id="specialRequests"
          name="specialRequests"
          value={bookingForm.specialRequests}
          onChange={handleInputChange}
          className="w-full p-2 border rounded-md"
          rows={3}
        />
      </div>

      {error && showError && (
          <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
            <div className="font-medium">Booking Error</div>
            <div>{error}</div>
            <button 
              onClick={() => setShowError(false)}
              className="mt-2 text-sm text-red-600 underline hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

      <div className="flex gap-2">
        <Button
          onClick={() => setStep(1)}
          variant="outline"
          className="w-full"
        >
          Back
        </Button>
        <Button
          onClick={handleStep2Submit}
          className="w-full bg-brand-purple hover:bg-brand-purple/90"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Proceed to Payment"}
        </Button>
      </div>
    </div>
  )

  console.log("BookingModal render - isOpen:", isOpen)
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <PaymentModal
          setBookingDetails={setBookingDetails}
          setIsModalOpen={setIsModalOpen}
          paymentData={paymentData}
          bookingForm={bookingForm}
          setChecking={setChecking}
          onPaymentSuccess={() => {
          onClose();
          setPaymentData(null);
          }}
          onPaymentFailure={(error) => setError(error)}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          setIsBookingConfirmed={setIsBookingConfirmed}
          bookingDetails={bookingDetails}
          />



      <DialogContent className="w-[95vw] sm:max-w-[500px] bg-white p-4 max-h-[90vh] overflow-y-auto rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Booking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-2 sm:px-0">
          <div className="text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4" />
              <span>
                {format(new Date(bookingForm.checkIn), 'PPP')} - {format(new Date(bookingForm.checkOut), 'PPP')}
              </span>
            </div>
          </div>

          {bookingForm.numberOfGuests > 0 && (
            <div className="text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span>
                  {bookingForm.numberOfGuests} guest{bookingForm.numberOfGuests > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {Object.entries(bookingForm.selectedRooms).map(([roomId, count]) => {
            const room = availableRooms.find(r => r._id === roomId)
            return count > 0 && room ? (
              <div key={roomId} className="text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <HomeIcon className="h-4 w-4" />
                  <span>
                    {room.type === 'Dorm' ? 
                      `${count} bed${count !== 1 ? 's' : ''} in Shared Dorm` : 
                      `${count} Private ${room.type} Room${count > 1 ? 's' : ''}`
                    }
                  </span>
                </div>
              </div>
            ) : null
          })}

          <div className="overflow-y-auto max-h-[calc(90vh-200px)] sm:max-h-none">
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  )

}
