import React, { useEffect, useState, createContext, useContext, forwardRef } from "react"
import { Star, ArrowLeft, ArrowRight } from 'lucide-react'
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './ui/carousel'
import { Card, CardContent} from './ui/card'
import { Button } from "./ui/button"

export default function GoogleReviews() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Fetch reviews from the API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/reviews`, {
          headers: { 
            "x-api-key": process.env.REACT_APP_API_KEY 
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        
        const data = await response.json();
        setReviews(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews. Please try again later.');
        setLoading(false);
      }
    };

    fetchReviews();
  }, [API_URL]);

  // Handle carousel pagination
  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Function to render stars based on rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => {
      if (i < Math.floor(rating)) {
        return <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />;
      } else if (i < rating) {
        return (
          <div key={i} className="relative w-5 h-5">
            <Star className="absolute left-0 w-5 h-5 text-gray-300" />
            <Star className="absolute left-0 w-5 h-5 fill-yellow-400 text-yellow-400 clip-half" />
          </div>
        );
      } else {
        return <Star key={i} className="w-5 h-5 text-gray-300" />;
      }
    });
  };

  // Function to get initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <section className="relative py-16 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative py-16 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="p-6 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="relative py-16 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-blue-600">What Our Guests Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            No reviews available at the moment. Be the first to share your experience!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-16 px-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-blue-600">What Our Guests Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover the experiences of our valued guests who have stayed with us
          </p>
        </div>

        <Carousel
          setApi={setApi}
          className="w-full"
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
          opts={{
            loop: true,
            align: "center",
          }}
        >
          <CarouselContent>
            {reviews.map((review, index) => (
              <CarouselItem key={review._id || index} className="md:basis-1/2 lg:basis-1/3 h-full">
                <div className="p-2 h-full">
                  <Card className="h-96 p-6 border border-blue-200 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl hover:border-blue-300 flex flex-col">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 border-2 border-blue-100 flex-shrink-0">
                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${review.author_name ? review.author_name[0] : 'U'}`}
                            alt={review.author_name}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{review.author_name}</h4>
                          <p className="text-xs text-gray-500">{review.source}</p>
                        </div>
                      </div>
                      
                      <div className="flex mb-3">
                        {renderStars(review.rating)}
                      </div>
                      
                      <blockquote className="flex-grow overflow-y-auto">
                        <p className="text-gray-600 italic text-sm leading-relaxed">
                          "{review.text}"
                        </p>
                      </blockquote>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}