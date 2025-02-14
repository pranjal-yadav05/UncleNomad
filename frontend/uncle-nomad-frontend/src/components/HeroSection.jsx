import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Button } from "./ui/button"

export default function HeroSection({ bookingDates, setBookingDates, checkAvailability }) {
  return (
    <section id="stays" className="relative h-[600px] flex items-center justify-center text-center px-4">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/hero-back.jpg')`,
        }}
      />
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative z-10 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white drop-shadow-lg">
          Your Mountain Retreat in Manali
        </h1>

        <Card className="w-full max-w-2xl bg-white/50 backdrop-blur-lg shadow-lg   ">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Check Room Availability</CardTitle>
            <CardDescription className="text-center">Find your perfect mountain stay</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Check-in Date</Label>
                <Input
                  type="date"
                  value={bookingDates.checkIn}
                  onChange={(e) => setBookingDates((prev) => ({ ...prev, checkIn: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Check-out Date</Label>
                <Input
                  type="date"
                  value={bookingDates.checkOut}
                  onChange={(e) => setBookingDates((prev) => ({ ...prev, checkOut: e.target.value }))}
                  min={bookingDates.checkIn}
                  className="w-full border-gray-200 focus:ring-2 focus:ring-brand-purple"
                />
              </div>
            </div>
            <Button onClick={checkAvailability} variant="custom" className="w-full font-medium py-3 text-white">
              Check Availability
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

