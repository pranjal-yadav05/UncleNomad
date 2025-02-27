import { useState } from 'react'
import { Dialog, DialogContent } from '../components/ui/dialog'
import PaytmPaymentForm from '../components/PaytmPaymentForm'
import FailedTransactionModal from '../modals/FailedTransactionModal'

export default function PaymentModal({
  paymentData,
  bookingForm,
  onPaymentSuccess,
  onPaymentFailure,
  isOpen,
  onClose,
  setIsBookingConfirmed,
  setIsModalOpen,
  setBookingDetails,
  bookingDetails,
  setChecking
}) {
  const [error, setError] = useState(null)
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);
  const handlePaymentSuccess = (response) => {
    onPaymentSuccess(response)
    onClose()
  }

  const handlePaymentFailure = (error) => {
    setError(error)
    setIsFailedModalOpen(true)
  }

  console.log("PaymentModal rendering - isOpen:", isOpen);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}
          {console.log("Rendering PaytmPaymentForm with paymentData:", paymentData)}
          <PaytmPaymentForm
            setChecking={setChecking}
            setIsModalOpen={setIsModalOpen}
            setIsBookingConfirmed={setIsBookingConfirmed}
            paymentData={paymentData}
            bookingForm={bookingForm}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
            onClose={onClose}
            setBookingDetails={setBookingDetails}
            bookingDetails={bookingDetails}
          />
        </div>
        <FailedTransactionModal 
          open={isFailedModalOpen} 
          onClose={() => setIsFailedModalOpen(false)} 
          errorMessage={error} 
        />
      </DialogContent>
    </Dialog>
  )
}
