import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { CheckCircle } from "lucide-react";
import { formatDate } from "../utils/dateUtils";

const TourBookingConfirmationDialog = ({
  tourBooking,
  onClose,
  isOpen = false,
}) => {
  const [open, setOpen] = useState(isOpen);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  if (!tourBooking) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full sm:w-[500px] mx-auto">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-red-600 mb-4">
            Booking Error
          </DialogTitle>
          <DialogDescription className="text-gray-700 mb-6 text-sm sm:text-base">
            Tour booking details could not be loaded. Please contact support.
          </DialogDescription>
          <DialogFooter>
            <Button
              onClick={handleClose}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Format the date properly
  const formattedDate = tourBooking.tourDate
    ? formatDate(tourBooking.tourDate)
    : "Not specified";

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          onClose?.();
        }
      }}>
      <DialogContent className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full sm:w-[500px] mx-auto">
        <div className="flex flex-col items-center mb-4">
          <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mb-2" />
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
            Tour Booking Confirmation
          </DialogTitle>
        </div>

        <DialogDescription className="text-center text-gray-700 mb-6 text-sm sm:text-base">
          Your tour has been successfully booked. Here are the details:
        </DialogDescription>

        <div className="space-y-4 border rounded-lg p-4 bg-gray-50 text-sm sm:text-base">
          {[
            { label: "Booking ID:", value: tourBooking._id },
            { label: "Guest Name:", value: tourBooking.guestName },
            { label: "Tour Name:", value: tourBooking.tourName },
            { label: "Date:", value: formattedDate },
            { label: "Total Price:", value: `₹${tourBooking.totalPrice}` },
          ].map((item, index) => (
            <div key={index} className="grid grid-cols-2 gap-2">
              <p className="text-gray-600 font-medium">{item.label}</p>
              <p className="text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button
            onClick={handleClose}
            className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TourBookingConfirmationDialog;
