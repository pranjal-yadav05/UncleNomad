import { Card } from "./ui/card";

export default function TourCard({ tour, onClick }) {
  return (
    <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <h3 className="text-xl font-semibold">{tour.title}</h3>
      <p className="text-gray-600 line-clamp-2">{tour.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-lg font-medium">₹{tour.price}</span>
        <span className="text-sm text-gray-500">{tour.duration} days</span>
      </div>
    </Card>
  )
}
