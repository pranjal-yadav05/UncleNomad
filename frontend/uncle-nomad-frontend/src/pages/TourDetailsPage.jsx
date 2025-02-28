// pages/tour/[id].js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { ChevronLeft, Clock, Users, Calendar, MapPin, IndianRupee, Star } from "lucide-react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import TourBookingModal from '../modals/TourBookingModal'
// Extracted components for better maintainability
import TourInfoCard from '../components/TourInfoCard';
import PricingCard from '../components/PricingCard';
import ItineraryDay from '../components/ItineraryDay';
import ReviewCard from '../components/ReviewCard';
import ImageGallery from '../components/ImageGallery';
import CheckingPaymentModal from '../modals/CheckingPaymentModal';


const TourDetailsPage = () => {
    const { state } = useLocation();
    const [tour, setTour] = useState(state?.selectedTour);
    const [activeTab, setActiveTab] = useState('overview');
    const [showImageModal, setShowImageModal] = useState(false);
    const [loading, setLoading] = useState(!tour);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null)
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isCheckingOpen, setIsCheckingOpen] = useState(false)
    const navigate = useNavigate()
    
    useEffect(() => {
        window.scrollTo(0, 0);
        if (!tour) {
            const fetchTourDetails = async () => {
                try {
                    setLoading(true);
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/tours/${state?.selectedTour?._id}`);
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch tour details');
                    }
                    
                    const data = await response.json();
                    setTour(data);
                } catch (err) {
                    setError(err.message);
                    console.error('Error fetching tour details:', err);
                } finally {
                    setLoading(false);
                }
            };

            fetchTourDetails();
        }
    }, [state?.selectedTour?._id]);

    // Handle loading and error states
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading tour details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md px-4">
                    <div className="text-red-500 text-5xl mb-4">!</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button 
                        onClick={() => navigate(-1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (!tour) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md px-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Tour Not Found</h2>
                    <p className="text-gray-600 mb-6">We couldn't find the tour you're looking for.</p>
                    <Button 
                        onClick={() => navigate(-1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    console.log('tour',tour)
    // Format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'TBD';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Get pricing information (handle optional priceOptions)
    const getPricingInfo = () => {
        // If priceOptions exists and has values, use the lowest one
        if (tour.priceOptions && Object.keys(tour.priceOptions).length > 0) {
            const prices = Object.values(tour.priceOptions).map(p => parseInt(p));
            return Math.min(...prices);
        }
        // Otherwise, fall back to the base price
        return parseInt(tour.price) || 'Contact for price';
    };

    // Calculate tour ratings (sample implementation)
    const ratings = {
        overall: 4.8,
        accommodation: 4.6,
        transportation: 4.7,
        activities: 4.9,
        valueForMoney: 4.5,
    };

    const handleImageClick = (image)=>{
        setSelectedImage(image)
        setShowImageModal(true)
    }

    return (
        <>
            <Header />
            {/* Hero Section with Parallax Effect */}
            <div 
                className="relative h-[60vh] bg-cover bg-center flex items-end"
                style={{
                    backgroundImage: `url(${tour.images[0] || '/placeholder-tour.jpg'})`,
                    backgroundAttachment: 'fixed',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                
                <div className="absolute top-4 left-4 md:left-8 z-20">
                    <Button
                        onClick={() => navigate(-1)}
                        className="bg-white/20 hover:bg-white/30 text-white flex items-center px-4 py-2 rounded-lg backdrop-blur-md transition-all duration-300"
                    >
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        Go Back
                    </Button>
                </div>
                <div className="container mx-auto px-4 z-10 relative pb-12">
                    
                    <div className="text-white">
                        <div className="opacity-100 animate-fade-in">
                            <h1 className="text-4xl md:text-5xl font-bold mb-2">{tour.title}</h1>
                            <div className="flex items-center flex-wrap gap-4 mb-4">
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    <span>{tour.location}</span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span>{tour.duration} days</span>
                                </div>
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    <span>Group size: {tour.groupSize}</span>
                                </div>
                                <div className="flex items-center text-yellow-400">
                                    <Star className="w-4 h-4 mr-1 fill-current" />
                                    <span>{ratings.overall}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Tour Information Section */}
            <div className="container mx-auto px-4 py-12 animate-slide-up">
                {/* Quick Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 -mt-16 relative z-20">
                    <TourInfoCard 
                        icon={<Calendar className="w-10 h-10 text-blue-600 mr-4" />}
                        title="Tour Dates"
                        content={`${formatDate(tour.startDate)} - ${formatDate(tour.endDate)}`}
                    />
                    <TourInfoCard 
                        icon={<Users className="w-10 h-10 text-blue-600 mr-4" />}
                        title="Available Spots"
                        content={`${tour.groupSize - tour.bookedSlots || 'Limited'} remaining`}
                    />
                    <TourInfoCard 
                        icon={<IndianRupee className="w-10 h-10 text-blue-600 mr-4" />}
                        title="Starting Price"
                        content={`₹${getPricingInfo()}`}
                    />
                </div>

                {/* Tabbed Navigation */}
                <div className="mb-8 border-b overflow-x-auto hide-scrollbar">
                    <div className="flex space-x-8 min-w-max">
                        <button 
                            onClick={() => setActiveTab('overview')} 
                            className={`pb-4 font-medium text-lg transition-colors ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('itinerary')} 
                            className={`pb-4 font-medium text-lg transition-colors ${activeTab === 'itinerary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
                        >
                            Itinerary
                        </button>
                        <button 
                            onClick={() => setActiveTab('pricing')} 
                            className={`pb-4 font-medium text-lg transition-colors ${activeTab === 'pricing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
                        >
                            Pricing
                        </button>
                        <button 
                            onClick={() => setActiveTab('reviews')} 
                            className={`pb-4 font-medium text-lg transition-colors ${activeTab === 'reviews' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
                        >
                            Reviews
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mb-12">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-6">
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">About This Tour</h2>
                                <p className="text-gray-700 leading-relaxed text-lg">{tour.description}</p>
                                
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                                    <h3 className="text-xl font-semibold text-blue-700 mb-2">Highlights</h3>
                                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                                        {tour.inclusions?.slice(0, 5).map((inclusion, index) => (
                                            <li key={index}>{inclusion}</li>
                                        )) || (
                                            <>
                                                <li>Explore the breathtaking landscapes of {tour.location}</li>
                                                <li>Experience authentic local culture and cuisine</li>
                                                <li>Professional guides throughout your journey</li>
                                                <li>Comfortable accommodations in scenic locations</li>
                                                <li>Small group size ensures personalized attention</li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                                
                                <ImageGallery 
                                    images={tour.images}
                                    onImageClick={handleImageClick}
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-24">
                                    <div className="bg-blue-600 py-4 px-6">
                                        <h3 className="text-xl font-semibold text-white">Book This Tour</h3>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-gray-700 mb-6">Secure your spot with a small deposit and pay the rest later. Spots fill quickly!</p>
                                        
                                        <div className="flex justify-between text-gray-700 font-medium mb-2">
                                            <span>Starting from</span>
                                            <span className="text-xl text-blue-600 font-bold">₹{getPricingInfo()}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-6">per person (based on double occupancy)</p>
                                        
                                        <Button
                                            onClick={() => setIsBookingModalOpen(true)}
                                            variant='custom'
                                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90 mt-6 py-3 rounded-lg shadow-lg"
                                        >
                                            Book Now
                                        </Button>
                                        
                                        <div className="mt-4 text-center">
                                            <p className="text-sm text-gray-500">Only {tour.availableSlots || 'limited'} spots left for this experience</p>
                                        </div>
                                        
                                        <div className="mt-8 border-t pt-6">
                                            <div className="flex items-center justify-center gap-2 text-gray-600">
                                                <span>Have questions?</span>
                                                <a href="#" className="text-blue-600 hover:underline">Contact us</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Itinerary Tab */}
                    {activeTab === 'itinerary' && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-8">Your Day-by-Day Adventure</h2>
                            <div className="space-y-8">
                                {tour.itinerary && tour.itinerary.map((day, index) => (
                                    <ItineraryDay 
                                        key={day._id || index}
                                        day={day}
                                        isLast={index === tour.itinerary.length - 1}
                                    />
                                ))}
                                
                                {(!tour.itinerary || tour.itinerary.length === 0) && (
                                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                                        <p className="text-gray-600">Detailed itinerary will be available soon.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pricing Tab */}
                    {activeTab === 'pricing' && (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-6">Tour Pricing Options</h2>
                            <p className="text-gray-700 mb-8">Choose the package that best suits your preferences and budget.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tour.priceOptions && Object.entries(tour.priceOptions).length > 0 ? (
                                    Object.entries(tour.priceOptions).map(([option, price], index) => (
                                        <PricingCard 
                                            key={option}
                                            title={option.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                                            price={price}
                                            isPopular={index === 1}
                                            features={[
                                                `${tour.duration} days guided tour`,
                                                'Accommodation included',
                                                'Transportation during tour',
                                                'Professional guide'
                                            ]}
                                            onSelect={() => alert(`Booking ${option} package...`)}
                                        />
                                    ))
                                ) : (
                                    // If no price options, show a single pricing card with the base price
                                    <PricingCard 
                                        title="Standard Package"
                                        price={tour.price || 'Contact for price'}
                                        isPopular={true}
                                        features={[
                                            `${tour.duration} days guided tour`,
                                            'Accommodation included',
                                            'Transportation during tour',
                                            'Professional guide'
                                        ]}
                                        onSelect={() => alert("Booking standard package...")}
                                    />
                                )}
                            </div>
                            
                            <div className="mt-12 bg-gray-50 p-6 rounded-lg">
                                <h3 className="text-xl font-semibold mb-4">What's Included</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                    {tour.inclusions?.map((item, index) => (
                                        <div key={index} className="flex items-start">
                                            <span className="text-green-500 mr-2">✓</span>
                                            <span>{item}</span>
                                        </div>
                                    )) || (
                                        <>
                                            <div className="flex items-start">
                                                <span className="text-green-500 mr-2">✓</span>
                                                <span>Professional, English-speaking guide</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="text-green-500 mr-2">✓</span>
                                                <span>Accommodation as per selected package</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="text-green-500 mr-2">✓</span>
                                                <span>Transportation during the tour</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="text-green-500 mr-2">✓</span>
                                                <span>All entrance fees to attractions</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                <h3 className="text-xl font-semibold mt-8 mb-4">What's Not Included</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                    {tour.exclusions?.map((item, index) => (
                                        <div key={index} className="flex items-start">
                                            <span className="text-red-500 mr-2">✕</span>
                                            <span>{item}</span>
                                        </div>
                                    )) || (
                                        <>
                                            <div className="flex items-start">
                                                <span className="text-red-500 mr-2">✕</span>
                                                <span>International or domestic flights</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="text-red-500 mr-2">✕</span>
                                                <span>Travel insurance</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="text-red-500 mr-2">✕</span>
                                                <span>Personal expenses</span>
                                            </div>
                                            <div className="flex items-start">
                                                <span className="text-red-500 mr-2">✕</span>
                                                <span>Meals not specified in the itinerary</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                                <h2 className="text-3xl font-bold text-gray-800">Guest Reviews</h2>
                                <div className="flex items-center mt-4 md:mt-0">
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star 
                                                key={star} 
                                                className={`w-5 h-5 ${star <= Math.round(ratings.overall) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                            />
                                        ))}
                                    </div>
                                    <span className="ml-2 text-gray-700 font-medium">{ratings.overall} out of 5</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <ReviewCard 
                                    name="Sarah Johnson"
                                    date="Traveled in January 2025"
                                    rating={5}
                                    review="This tour exceeded all my expectations! The guides were knowledgeable and friendly, and the itinerary was perfectly balanced between activities and free time. I particularly enjoyed the local experiences and authentic cuisine."
                                />
                                
                                <ReviewCard 
                                    name="Michael Chen"
                                    date="Traveled in December 2024"
                                    rating={4}
                                    review="Great experience overall. The accommodations were comfortable and the tour guide was incredibly knowledgeable. I would have liked a bit more free time to explore on my own, but otherwise it was a fantastic trip."
                                />
                                
                                <ReviewCard 
                                    name="David Müller"
                                    date="Traveled in November 2024"
                                    rating={5}
                                    review="One of the best tours I've ever taken! The scenery was breathtaking and our guide went above and beyond to make sure everyone had a great experience. The small group size made it feel very personal and we made friends we'll keep in touch with."
                                />
                                
                                <ReviewCard 
                                    name="Emily Rodriguez"
                                    date="Traveled in October 2024"
                                    rating={4}
                                    review="This tour was well organized and hit all the major highlights of the region. The accommodations were nice and the food was excellent. The only downside was that some days felt a bit rushed, but overall it was a wonderful experience."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* CTA Section */}
                <div 
                    className="relative rounded-xl bg-gray-50 p-8 md:p-12 text-white text-center"
                    style={{
                        backgroundImage: 'url("/solo.jpeg")',
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 rounded-xl"></div>

                    {/* Content (positioned above the overlay) */}
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4">Ready for an Unforgettable Adventure?</h2>
                        <p className="text-lg mb-8 max-w-2xl mx-auto">
                            Join us on this incredible journey through {tour.location}. Limited spaces available for this exclusive experience.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button
                                onClick={() => setIsBookingModalOpen(true)}
                                className="bg-transparent border-2 border-white hover:bg-white/10 text-white text-lg py-3 px-8 rounded-lg font-medium"
                            >
                                Book Now
                            </Button>
                            <Button
                                onClick={() => {
                                    const element = document.getElementById("get-in-touch");
                                    if (element) {
                                      element.scrollIntoView({ behavior: "smooth" });
                                    } else {
                                      navigate("/#get-in-touch"); // Fallback if section isn't on the current page
                                    }
                                  }}
                                className="bg-transparent border-2 border-white hover:bg-white/10 text-white text-lg py-3 px-8 rounded-lg font-medium"
                            >
                                Ask a Question
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Image Modal */}
            {showImageModal && (
                <div 
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" 
                    onClick={() => setShowImageModal(false)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img 
                            src={selectedImage} 
                            alt={tour.title} 
                            className="max-w-full max-h-[90vh] object-contain"
                            loading="lazy"
                        />
                        <button 
                            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowImageModal(false);
                                setSelectedImage(null)
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            
            <Footer />
            <TourBookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                selectedTour={tour}
                isCheckingOpen={isCheckingOpen}
                setIsCheckingOpen={setIsCheckingOpen}
            />
            <CheckingPaymentModal
              open={isCheckingOpen}
            />

        </>
    );
};

export default TourDetailsPage;