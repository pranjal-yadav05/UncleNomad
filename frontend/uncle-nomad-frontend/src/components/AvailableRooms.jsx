import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import  LoadingSection  from "./LoadingSection"

export default function AvailableRooms({ availableRooms, handleBookNowClick, checkIn, checkOut, isLoading }) {
  if (!isLoading && availableRooms.length === 0) return null

  // Format dates to be more readable
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const dateRange = checkIn && checkOut 
    ? `${formatDate(checkIn)} - ${formatDate(checkOut)}`
    : ''

    if (isLoading) {
        return <LoadingSection title="Available Rooms" />
      }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Available Rooms</h2>
        {dateRange && (
          <p className="text-gray-600 mt-2">
            For stay during {dateRange}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availableRooms.map((room) => (
          <Card key={room.id}>
            <CardHeader>
              <CardTitle>{room.type}</CardTitle>
              <CardDescription>Capacity: {room.capacity} persons</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside mb-4">
                {room.amenities.map((amenity, index) => (
                  <li key={index}>{amenity}</li>
                ))}
              </ul>
              <p className="text-2xl font-bold">₹{room.price}/night</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleBookNowClick(room)} className="w-full text-white" variant="custom">
                Book Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}