import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { CheckCircle, Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "react-hot-toast";
import { generateRoomTicketTemplate } from "../templates/roomTicketTemplate";
import { formatDateDDMMYYYY } from "../templates/dateUtils";

const BookingConfirmationDialog = ({ booking, onClose }) => {
  // Function to download ticket
  const downloadTicket = () => {
    try {
      // Generate the ticket HTML using the template
      const ticketHtml = generateRoomTicketTemplate(
        booking,
        formatDateDDMMYYYY
      );

      // Create a new window and write the ticket HTML
      const ticketWindow = window.open("", "_blank");
      if (!ticketWindow) {
        alert("Please allow pop-ups to view the ticket");
        return;
      }

      // Write to the window and show the ticket
      ticketWindow.document.write(ticketHtml);
      ticketWindow.document.close();

      toast.success("Ticket generated successfully!");
    } catch (error) {
      toast.error(`Error generating ticket: ${error.message}`);
    }
  };

  if (!booking) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="text-lg font-semibold mb-4">
            Booking Error
          </DialogTitle>
          <DialogDescription className="mb-4">
            Booking details could not be loaded. Please contact support.
          </DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          console.log("Setting hasNewBooking flag in sessionStorage");
          sessionStorage.setItem("hasNewBooking", "true");
          console.log(
            "hasNewBooking flag set:",
            sessionStorage.getItem("hasNewBooking")
          );
          // Add a small delay to ensure the flag is set before navigation
          setTimeout(() => {
            onClose();
          }, 100);
        }
      }}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col items-center mb-4">
          <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mb-2" />
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
            Booking Confirmation
          </DialogTitle>
        </div>

        <DialogDescription className="mb-4">
          Your booking has been successfully confirmed. Here are the details:
        </DialogDescription>

        <div className="space-y-2">
          <div>
            <span className="font-medium">Booking ID:</span> {booking._id}
          </div>
          <div>
            <span className="font-medium">Guest Name:</span> {booking.guestName}
          </div>
          <div>
            <span className="font-medium">Check-in:</span>{" "}
            {new Date(booking.checkIn).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Check-out:</span>{" "}
            {new Date(booking.checkOut).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Total Price:</span> ₹
            {booking.totalPrice}
          </div>
        </div>

        <DialogFooter className="mt-6 flex-col space-y-2">
          <Button
            onClick={downloadTicket}
            variant="outline"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Download Ticket
          </Button>
          <Button
            onClick={onClose}
            className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingConfirmationDialog;
