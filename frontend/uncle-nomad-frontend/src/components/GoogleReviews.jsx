import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // Import carousel styles
import { Star } from "lucide-react"; // Icon for star ratings

// Sample Reviews
const reviews = [
  {
    author_name: "Raghavendra",
    profile_photo_url: "",
    rating: 5,
    text: "Property is really amazing and very peaceful. Love the stay and had an amazing time here.",
    source: "Booking.com"
  },
  {
    author_name: "Aseem",
    profile_photo_url: "https://example.com/profile1.jpg",
    rating: 5,
    text: "I liked the warm and cordial interactions with the hosts; the location of the property situated more in the wilderness yet close to cafes/restaurants and the hotel amenities.",
    source: "Booking.com"
  },
  {
    author_name: "Vadher",
    profile_photo_url: "/default-user.png",
    rating: 5,
    text: "The ambiance is really great, loved the vibe of the place, the staff is very polite and helpful. The view is worth every step; the food is really good, rooms are clean and well maintained.",
    source: "Booking.com"
  },
  {
    author_name: "Shivam",
    profile_photo_url: "",
    rating: 5,
    text: "The location was beautiful. Staff was great. Food was simple and tasty. Felt like home. Saurabh and Kunal both were very friendly and helpful and went beyond in making our stay so memorable and amazing.",
    source: "Booking.com"
  },
  {
    author_name: "Suman121069",
    profile_photo_url: "/default-user.png",
    rating: 5,
    text: "The food, ambiance, everything, and the most, the Hachi.",
    source: "Booking.com"
  }
];

export default function GoogleReviews() {
  return (
    <section 
      className="relative text-center py-16"
    >

      <div className="container mx-auto px-6 relative z-10">
        <h2 className="text-4xl font-extrabold mb-8 text-white drop-shadow-lg">What Our Guests Say</h2>

        {reviews.length > 0 ? (
          <Carousel
            showThumbs={false}
            showStatus={false}
            autoPlay
            infiniteLoop
            interval={5000}
            className="max-w-3xl mx-auto"
          >
            {reviews.map((review, index) => {
              // Handle missing or empty profile photos
              const profileImage = review.profile_photo_url && review.profile_photo_url.trim() !== ""
                ? review.profile_photo_url
                : "/default.png";

              return (
                <div 
                  key={index} 
                  className="bg-white/10 backdrop-blur-lg border border-white/30 shadow-lg rounded-xl p-6 flex flex-col text-center transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  
                  {/* Profile & Name Section */}
                  <div className="flex items-center gap-3 justify-center mb-3">
                    <div className="w-10 h-10 flex-shrink-0">
                      <img
                        src={'/default.jpg'}
                        alt={review.author_name}
                        className="w-full h-full rounded-full border border-pink-400 object-cover"
                        onError={(e) => { e.target.src = "/default.png"; }} // Fallback if the image fails to load
                      />
                    </div>
                    <h4 className="font-semibold text-lg text-white">{review.author_name}</h4>
                  </div>

                  {/* Star Rating */}
                  <div className="flex justify-center my-2">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400" />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-white/80 italic max-w-lg mx-auto text-sm">"{review.text}"</p>

                  {/* Source */}
                  <p className="text-xs text-gray-300 mt-2 mb-5">Source: {review.source}</p>
                </div>
              );
            })}
          </Carousel>
        ) : (
          <p className="text-gray-300">No reviews available yet.</p>
        )}
      </div>
    </section>
  );
}