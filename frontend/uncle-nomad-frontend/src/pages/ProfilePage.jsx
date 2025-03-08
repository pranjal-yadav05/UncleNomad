"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { Skeleton } from "../components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { CalendarDays, LogOut, MapPin, User, Compass } from "lucide-react"
import Footer from "../components/Footer"
import Header from "../components/Header"

export default function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [roomBookings, setRoomBookings] = useState([])
  const [tourBookings, setTourBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const authToken = localStorage.getItem("authToken")
    const userName = localStorage.getItem("userName")
    const userEmail = localStorage.getItem("userEmail")

    if (!authToken) {
      navigate("/login") // Redirect if not authenticated
    } else {
      setUser({ name: userName || "", email: userEmail || "" })
      fetchRoomBookings(authToken)
      fetchTourBookings(authToken)
    }
  }, [navigate])

  const fetchRoomBookings = async (authToken) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings/user-bookings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY || "",
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch room bookings")
      }

      const data = await response.json()
      // Sort bookings with newest (by checkIn date) first
      const sortedBookings = data.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
      setRoomBookings(sortedBookings)
    } catch (error) {
      console.error("Error fetching room bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTourBookings = async (authToken) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/tours/user-tour-booking`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY || "",
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch tour bookings")
      }

      const data = await response.json()

      // Sort bookings with newest (by tourDate) first
      const sortedBookings = data.sort((a, b) => new Date(b.tourDate) - new Date(a.tourDate))
      setTourBookings(sortedBookings)
    } catch (error) {
      console.error("Error fetching tour bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userName")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("token")
    navigate("/") // Redirect to homepage
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  // Format date to be more readable
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (!user) {
    return (
      <>
        <Header />
        <div className="max-w-4xl min-h-screen mx-auto mt-10 p-6">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3 mb-6" />
          <Skeleton className="h-10 w-24 mb-8" />
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="max-w-screen min-h-screen mx-auto px-4 sm:px-6 flex justify-center items-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        <div className="grid grid-cols-1 md:grid-cols-3 mt-10 gap-6 mb-20 w-full max-w-6xl">
          {/* Profile Card */}
          <Card className="md:col-span-1 max-h-fit bg-white">
            <CardHeader className="pb-3">
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="flex flex-col items-center space-y-4 mb-6">
              <img 
                className="h-24 w-24 rounded-full object-cover"
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name ? user.name[0] : 'U'}`} 
                alt={user.name} 
              />
              <div className="text-center">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>


              <div className="space-y-4">
                <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Section */}
          <div className="md:col-span-2 bg-white">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>View your room and tour bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="rooms" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 border rounded-lg overflow-hidden">
                    <TabsTrigger 
                      value="rooms" 
                      className="py-2 px-4 text-gray-600 font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      Room Bookings
                    </TabsTrigger>
                    <TabsTrigger 
                      value="tours" 
                      className="py-2 px-4 text-gray-600 font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      Tour Bookings
                    </TabsTrigger>
                  </TabsList>

                  {/* Room Bookings Tab */}
                  <TabsContent value="rooms" className="w-full mt-4">
                    {loading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : roomBookings.length > 0 ? (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto w-full">
                        {roomBookings.map((booking, index) => (
                          <RoomBookingCard
                            key={booking._id}
                            booking={booking}
                            getStatusColor={getStatusColor}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 w-full">
                        <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">No room bookings</h3>
                        <p className="text-muted-foreground mt-1">You don't have any room bookings yet.</p>
                        <Button className="mt-4" onClick={() => navigate("/availability")}>
                          Book a Room
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tour Bookings Tab */}
                  <TabsContent value="tours" className="w-full mt-4">
                    {loading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : tourBookings.length > 0 ? (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto w-full">
                        {tourBookings.map((booking, index) => (
                          <TourBookingCard
                            key={booking._id}
                            booking={booking}
                            getStatusColor={getStatusColor}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 w-full">
                        <Compass className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">No tour bookings</h3>
                        <p className="text-muted-foreground mt-1">You don't have any tour bookings yet.</p>
                        <Button className="mt-4" onClick={() => navigate("/tours")}>
                          Book a Tour
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function RoomBookingCard({ booking, getStatusColor, formatDate }) {
  return (
    <Card className="overflow-hidden w-full">
      <div className="flex flex-col sm:flex-row">
        
        {/* Image Section */}
        <div className="sm:w-1/3 bg-muted p-4 flex flex-col justify-center items-center min-w-[150px]">
          {booking.rooms.length > 0 && booking.rooms[0].images.length > 0 ? (
            <img
              src={booking.rooms[0].images[0]} 
              alt={booking.rooms[0].roomType}
              className="w-full h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-32 bg-gray-300 flex items-center justify-center text-sm text-gray-500">
              No Image Available
            </div>
          )}
          
          <div className="text-center mt-2">
            <h4 className="font-medium">{booking.rooms.map((r) => r.roomType).join(", ")}</h4>
            {booking.location && (
              <div className="flex items-center justify-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{booking.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Booking Details Section */}
        <div className="p-4 sm:w-2/3">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold truncate">Booking #{booking._id.slice(-6)}</h3>
              <Badge className={getStatusColor(booking.status)} variant="outline">
                {booking.status}
              </Badge>
            </div>
            {booking.totalAmount && (
              <div className="text-right">
                <span className="font-semibold">${booking.totalAmount}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between mt-3">
            <div className="mb-2 sm:mb-0">
              <div className="text-sm text-muted-foreground">Check-in</div>
              <div className="font-medium">{formatDate(booking.checkIn)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Check-out</div>
              <div className="font-medium">{formatDate(booking.checkOut)}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function TourBookingCard({ booking, getStatusColor, formatDate }) {
  return (
    <Card className="overflow-hidden w-full">
      <div className="flex flex-col sm:flex-row">
        
        {/* Image Section */}
        <div className="sm:w-1/3 bg-muted p-4 flex flex-col justify-center items-center">
          {booking.tourImage ? (
            <img
              src={booking.tourImage}
              alt={booking.tourName || "Tour"}
              className="w-full h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-32 bg-gray-300 flex items-center justify-center text-sm text-gray-500">
              No Image Available
            </div>
          )}
          
          <div className="text-center mt-2">
            <h4 className="font-medium">{booking.tourName || "Tour"}</h4>
            {booking.location && (
              <div className="flex items-center justify-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{booking.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Booking Details Section */}
        <div className="p-4 sm:w-2/3">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold">Tour #{booking._id.slice(-6)}</h3>
              <Badge className={getStatusColor(booking.status)} variant="outline">
                {booking.status}
              </Badge>
            </div>
            {booking.totalAmount && (
              <div className="text-right">
                <span className="font-semibold">${booking.totalAmount}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between mt-3">
            <div className="mb-2 sm:mb-0">
              <div className="text-sm text-muted-foreground">Tour Date</div>
              <div className="font-medium">{formatDate(booking.tourDate)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Participants</div>
              <div className="font-medium">{booking.participants || "N/A"}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}