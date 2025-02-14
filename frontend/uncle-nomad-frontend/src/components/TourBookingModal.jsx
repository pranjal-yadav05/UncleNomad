import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

export default function TourBookingModal({ isOpen, onClose, selectedTour }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[500px] bg-white p-4 sm:p-6 rounded-lg shadow-xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900">Book Your Tour</DialogTitle>
          <DialogDescription>
            {selectedTour && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-lg text-gray-900">{selectedTour.title}</h4>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <p className="text-brand-purple font-medium">₹{selectedTour.price}</p>
                  <p className="text-gray-600">{selectedTour.duration}</p>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onClose()
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tourDate" className="text-sm font-medium text-gray-900">
                Tour Date
              </Label>
              <Input
                id="tourDate"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tourParticipants" className="text-sm font-medium text-gray-900">
                Number of Participants
              </Label>
              <Input
                id="tourParticipants"
                type="number"
                min="1"
                required
                className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="custom"
              className="flex-1 bg-brand-purple hover:bg-brand-purple/90 text-white"
            >
              Confirm Tour Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}