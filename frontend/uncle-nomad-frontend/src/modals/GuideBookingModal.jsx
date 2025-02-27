import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

export default function GuideBookingModal({ isOpen, onClose, selectedGuide }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[500px] bg-white p-4 sm:p-6 rounded-lg shadow-xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900">Book Your Guide</DialogTitle>
          <DialogDescription>
            {selectedGuide && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-lg text-gray-900">{selectedGuide.name}</h4>
                <p className="mt-2 text-gray-600">Speciality: {selectedGuide.speciality}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Experience: {selectedGuide.experience}</p>
                  <p>Languages: {selectedGuide.languages.join(", ")}</p>
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
              <Label htmlFor="guideDate" className="text-sm font-medium text-gray-900">
                Date
              </Label>
              <Input
                id="guideDate"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guideDuration" className="text-sm font-medium text-gray-900">
                Duration (hours)
              </Label>
              <Input
                id="guideDuration"
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
              Confirm Guide Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}