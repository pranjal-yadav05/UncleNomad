import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"

export default function BookingConfirmationDialog({ bookingDetails, onClose }) {
  if (!bookingDetails) return null
  console.log(bookingDetails )
  return (
    <Dialog open={!!bookingDetails} onOpenChange={onClose} className="fixed inset-0 z-50 bg-black/50">
      <DialogContent className="sm:max-w-[500px] bg-white p-6 rounded-lg shadow-xl">
        <div className="bg-white p-6 rounded-lg">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Booking Confirmed!
            </DialogTitle>
            <DialogDescription>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Booking ID</span>
                  <span className="font-medium text-gray-900">{bookingDetails.id}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Room Type</span>
                  <span className="font-medium text-gray-900">{bookingDetails.roomType}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium text-gray-900">
                    {bookingDetails.checkIn}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium text-gray-900">
                    {bookingDetails.checkOut}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-900 font-semibold">Total Price</span>
                  <span className="text-xl font-bold text-brand-purple">₹{bookingDetails.totalPrice}</span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose} className="w-full bg-brand-purple hover:bg-brand-purple/90 hover:text-white">
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
