import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { XCircle } from "lucide-react";

const BookingFailedDialog = ({ errorMessage, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col items-center mb-4">
          <XCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mb-2" />
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
            Booking Failed
          </DialogTitle>
        </div>

        <DialogDescription className="mb-4 text-center">
          {errorMessage || "Unfortunately, we were unable to complete your booking. Please try again or contact support."}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default BookingFailedDialog;
