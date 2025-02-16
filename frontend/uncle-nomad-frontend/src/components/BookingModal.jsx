import { useState } from 'react'
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
  handleBookingSubmit,
  isLoading,
  availableRooms,
  handleRoomSelection,
  error,
  setError
}) {
  const [step, setStep] = useState(0)
  const [validationErrors, setValidationErrors] = useState({})
  
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

  const validateStep2 = () => {
    const errors = {}
    
    if (!bookingForm.numberOfGuests || bookingForm.numberOfGuests < 1) {
      errors.numberOfGuests = 'At least 1 guest is required'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return false
    }
    
    return true
  }

  const renderStep0 = () => (
    <div className="spacey-4">
      <h3 className="text-lg font-semibold">Select Rooms</h3>
      {availableRooms.map(room => {
        const isDorm = room.type.toLowerCase() === 'dorm'
        const currentCount = bookingForm.selectedRooms[room._id] || 0
        const remainingCapacity = isDorm ? room.capacity - currentCount : room.totalRooms - currentCount
        
        return (
          <div key={room._id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">
                  {isDorm ? 'Dorm Bed' : `${room.type} Room`}
                </h4>
                <p className="text-sm text-gray-500">
                  ₹{room.price}/night {isDorm && '(per bed)'}
                </p>
                {isDorm && (
                  <p className="text-sm text-gray-500">
                    Shared Room - {remainingCapacity} bed{remainingCapacity !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    if (currentCount > 0) {
                      handleRoomSelection(room._id, currentCount - 1)
                    }
                  }}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                  disabled={currentCount === 0}
                >
                  -
                </button>
                <span>{currentCount}</span>
                <button 
                  onClick={() => {
                    if (remainingCapacity > 0) {
                      handleRoomSelection(room._id, currentCount + 1)
                    }
                  }}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                  disabled={remainingCapacity === 0}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )
      })}
      <Button
        onClick={() => setStep(1)}
        className="w-full bg-brand-purple hover:bg-brand-purple/90"
        disabled={Object.keys(bookingForm.selectedRooms).length === 0}
      >
        Next
      </Button>
      <p className="text-sm text-gray-500 mt-2">
        Note: When booking dorm beds, you're reserving individual beds in a shared space. 
        Private rooms are booked as complete units.
      </p>
    </div>
  )

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
          className="w-full bg-brand-purple hover:bg-brand-purple/90"
          disabled={!bookingForm.guestName || !bookingForm.email || !bookingForm.phone}
        >
          Next
        </Button>
      </div>
    </div>
  )

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

      <div className="flex gap-2">
        <Button
          onClick={() => setStep(1)}
          variant="outline"
          className="w-full"
        >
          Back
        </Button>
        <Button
          onClick={(e) => {
            if (validateStep2()) {
              handleBookingSubmit(e)
            }
          }}
          className="w-full bg-brand-purple hover:bg-brand-purple/90"
          disabled={isLoading}
        >
          {isLoading ? 'Booking...' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  )


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Booking Details
          </DialogTitle>
        </DialogHeader>

        


        <div className="space-y-4">
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

          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </div>
        {error && (
          <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
            <div className="font-medium">Booking Error</div>
            <div>{error}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
