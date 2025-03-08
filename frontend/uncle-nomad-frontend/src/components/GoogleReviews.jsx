import React, { useEffect, useState, createContext, useContext, forwardRef } from "react"
import { Star, ArrowLeft, ArrowRight } from 'lucide-react'
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"

/**
 * @typedef {Object} Review
 * @property {string} author_name - The name of the reviewer
 * @property {string} profile_photo_url - URL to the reviewer's profile photo
 * @property {number} rating - The rating given by the reviewer (1-5)
 * @property {string} text - The review text
 * @property {string} source - The source of the review (e.g., "Booking.com")
 */

// Sample Reviews
const reviews = [
  {
    author_name: "Raghavendra",
    profile_photo_url: "",
    rating: 4.5,
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
    rating: 4,
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
    rating: 4.5,
    text: "The food, ambiance, everything, and the most, the Hachi.",
    source: "Booking.com"
  }
]

// Utility function to conditionally join class names
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

// Custom Avatar Components
const Avatar = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} 
      {...props}
    >
      {children}
    </div>
  )
}

const AvatarImage = ({ src, alt, className, ...props }) => {
  return (
    <img 
      src={src || "/placeholder.svg"} 
      alt={alt || ""} 
      className={cn("aspect-square h-full w-full object-cover", className)} 
      {...props} 
      onError={(e) => { e.target.style.display = 'none' }}
    />
  )
}

const AvatarFallback = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn("flex h-full w-full items-center justify-center rounded-full", className)} 
      {...props}
    >
      {children}
    </div>
  )
}

// Custom Card Components
const Card = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn("rounded-lg border bg-white text-card-foreground shadow-sm", className)} 
      {...props}
    >
      {children}
    </div>
  )
}

const CardContent = ({ className, children, ...props }) => {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  )
}

// Custom Button Component
const Button = forwardRef(({ className, variant = "default", size = "default", children, ...props }, ref) => {
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  }
  
  const sizeStyles = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  }
  
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
Button.displayName = "Button"

// Custom Carousel Components
const CarouselContext = createContext(null)

const useCarousel = () => {
  const context = useContext(CarouselContext)
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }
  return context
}

const Carousel = forwardRef(({ orientation = "horizontal", opts, plugins, setApi, className, children, ...props }, ref) => {
  const [carouselRef, api] = useEmblaCarousel({
    ...opts,
    axis: orientation === "horizontal" ? "x" : "y",
  }, plugins)
  
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = (api) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }

  const scrollPrev = () => {
    api?.scrollPrev()
  }

  const scrollNext = () => {
    api?.scrollNext()
  }

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      scrollPrev()
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      scrollNext()
    }
  }

  useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("select", () => onSelect(api))
    api.on("reInit", () => onSelect(api))

    return () => {
      api.off("select", () => onSelect(api))
      api.off("reInit", () => onSelect(api))
    }
  }, [api])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts,
        orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        ref={ref}
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
})
Carousel.displayName = "Carousel"

const CarouselContent = forwardRef(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = forwardRef(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = forwardRef(({ className, ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant="outline"
      size="icon"
      className={cn(
        "h-8 w-8 rounded-full border border-gray-200 bg-white",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = forwardRef(({ className, ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant="outline"
      size="icon"
      className={cn(
        "h-8 w-8 rounded-full border border-gray-200 bg-white",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export default function GoogleReviews() {
  const [api, setApi] = useState(null)
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

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
      .substring(0, 2)
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
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 h-full">
                <div className="p-2 h-full">
                  <Card className=" min-h-[300px] p-10 border border-blue-200 bg-white/90 backdrop-blur-sm shadow-lg h-full transition-all duration-300 hover:shadow-xl hover:border-blue-300">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-12 w-12 border-2 border-blue-100">
                          <AvatarImage src={review.profile_photo_url || "/placeholder.svg?height=48&width=48"} alt={review.author_name} />
                          <AvatarFallback className="bg-blue-50 text-blue-600 font-medium">
                            {getInitials(review.author_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-800">{review.author_name}</h4>
                          <p className="text-xs text-gray-500">{review.source}</p>
                        </div>
                      </div>
                      
                      <div className="flex mb-3">
                        {renderStars(review.rating)}
                      </div>
                      
                      <blockquote className="flex-grow">
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
          
          <div className="flex items-center justify-center gap-2 mt-8">
            <CarouselPrevious className="static transform-none mx-2" />
            <span className="text-sm text-gray-500">
              {current} / {count}
            </span>
            <CarouselNext className="static transform-none mx-2" />
          </div>
        </Carousel>
      </div>
    </section>
  )
}
