"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Calendar,
  Grid3X3,
  List,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { formatDate, formatDateWithOptions } from "../utils/dateUtils";

export default function ToursPage() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [durationRange, setDurationRange] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [email, setEmail] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTours, setTotalTours] = useState(0);
  const itemsPerPage = 6; // Fixed items per page

  const navigate = useNavigate();

  const categories = ["all", "Adventure", "Cultural", "Relaxation"];

  useEffect(() => {
    window.scrollTo(0, 0);
    // Load tours when page changes
    fetchTours();
  }, [currentPage]);

  const resetAllFilters = () => {
    setActiveCategory("all");
    setSearchQuery("");
    setPriceRange("all");
    setDurationRange("all");
    setSortBy("date");
    setCurrentPage(1); // Reset to page 1
    fetchTours(); // Fetch fresh data
  };

  const fetchTours = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      const response = await fetch(`${API_URL}/api/tours?${queryParams}`, {
        headers: { "x-api-key": process.env.REACT_APP_API_KEY },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update state with the data from the API
      setTours(data.tours || data); // Handle both formats
      setFilteredTours(data.tours || data);

      // Update pagination information
      if (data.totalPages) {
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage || 1);
        setTotalTours(data.totalTours || 0);
      } else {
        // Fallback if pagination info is not available
        const toursList = data.tours || data;
        setTotalTours(toursList.length);
        setTotalPages(Math.ceil(toursList.length / itemsPerPage));
      }
    } catch (error) {
      console.error("Error fetching tours:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // When the user clicks the "Search" button or presses Enter in the search field
  const handleSearch = (e) => {
    if (e) e.preventDefault();

    // If no filters are applied, just fetch from the server (page 1)
    if (
      activeCategory === "all" &&
      !searchQuery &&
      priceRange === "all" &&
      durationRange === "all" &&
      sortBy === "date"
    ) {
      setCurrentPage(1);
      fetchTours();
    } else {
      // Otherwise, apply client-side filtering
      applyFilters();
    }
  };

  // Apply filters client-side
  const applyFilters = () => {
    let result = [...tours];

    // Filter by category
    if (activeCategory !== "all") {
      result = result.filter(
        (tour) => tour.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (tour) =>
          tour.title?.toLowerCase().includes(query) ||
          tour.location?.toLowerCase().includes(query) ||
          tour.description?.toLowerCase().includes(query)
      );
    }

    // Filter by price range
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      result = result.filter((tour) => {
        const price = parseInt(tour.price);
        return price >= min && (max ? price <= max : true);
      });
    }

    // Filter by duration
    if (durationRange !== "all") {
      const [min, max] = durationRange.split("-").map(Number);
      result = result.filter((tour) => {
        const duration = parseInt(tour.duration);
        return duration >= min && (max ? duration <= max : true);
      });
    }

    // Apply sorting
    if (sortBy === "date") {
      result.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    } else if (sortBy === "price-low") {
      result.sort((a, b) => parseInt(a.price) - parseInt(b.price));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => parseInt(b.price) - parseInt(a.price));
    } else if (sortBy === "duration") {
      result.sort((a, b) => parseInt(b.duration) - parseInt(a.duration));
    } else if (sortBy === "availability") {
      result.sort(
        (a, b) => b.groupSize - b.bookedSlots - (a.groupSize - a.bookedSlots)
      );
    }

    setFilteredTours(result);
  };

  const handleTourClick = (tour) => {
    navigate(`/tour/${tour._id}`, {
      state: { selectedTour: tour },
    });
  };

  // Calculate available slots
  const getAvailableSlots = (tour) => {
    return tour.groupSize - tour.bookedSlots;
  };

  // Pagination controls
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of results
      window.scrollTo({ top: 500, behavior: "smooth" });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 3; // Show max 3 page numbers

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Show current page and surrounding pages
      if (currentPage > 2) {
        pageNumbers.push("...");
      }

      // Current page (if not 1 or last)
      if (currentPage !== 1 && currentPage !== totalPages) {
        pageNumbers.push(currentPage);
      }

      // Show ellipsis if needed
      if (currentPage < totalPages - 1) {
        pageNumbers.push("...");
      }

      // Always show last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const response = await fetch(`${API_URL}/api/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
        body: JSON.stringify({ email: email }),
      });
      if (response.ok) {
        setSubscribing(false);
        setShowConfirm(true);
        setTimeout(() => {
          setEmail("");
          setShowConfirm(false);
        }, 2000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">
      <Header />

      <main className="flex-grow">
        {/* Hero section */}
        <div className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/tours-top.jpeg')",
              filter: "blur(2px)",
              backgroundPosition: "cover",
            }}></div>

          <div className="container mx-auto px-4 relative z-20 text-center">
            <h1
              className="text-5xl md:text-6xl font-extrabold text-white mb-6"
              >
              Discover Our Adventures
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Handcrafted journeys to the most breathtaking destinations across
              India and beyond
            </p>

            <form
              onSubmit={handleSearch}
              className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-full p-2 flex items-center">
              <Input
                type="text"
                placeholder="Search destinations, experiences..."
                className="flex-grow bg-transparent border-none text-white placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="p-3 flex rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                <Search className="w-5 h-5 mr-2" />
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Filters and view toggles */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  className={`px-4 py-2 text-sm capitalize cursor-pointer transition-all ${
                    activeCategory === category
                      ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                      : "hover:bg-slate-800 text-white"
                  }`}
                  onClick={() => setActiveCategory(category)}>
                  {category}
                </Badge>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <Button
                size="sm"
                variant="outline"
                className="text-white border-white/20 hover:bg-white/10"
                onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>

              <div className="flex items-center bg-white/10 rounded-lg p-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md px-3 py-1 flex items-center transition-colors ${
                    viewMode === "grid"
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}>
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Grid
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewMode("list")}
                  className={`rounded-md px-3 py-1 flex items-center transition-colors ${
                    viewMode === "list"
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}>
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-white text-sm mb-2 block">
                  Price Range
                </label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="0-20000">₹0 - ₹20,000</SelectItem>
                    <SelectItem value="20000-30000">
                      ₹20,000 - ₹30,000
                    </SelectItem>
                    <SelectItem value="30000-40000">
                      ₹30,000 - ₹40,000
                    </SelectItem>
                    <SelectItem value="40000">₹40,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">
                  Duration
                </label>
                <Select value={durationRange} onValueChange={setDurationRange}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Duration</SelectItem>
                    <SelectItem value="1-5">1-5 Days</SelectItem>
                    <SelectItem value="6-10">6-10 Days</SelectItem>
                    <SelectItem value="11-15">11-15 Days</SelectItem>
                    <SelectItem value="16">16+ Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Upcoming Dates</SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="duration">
                      Duration: Longest First
                    </SelectItem>
                    <SelectItem value="availability">Availability</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                  Apply Filters
                </Button>
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="text-white/80 mb-6">
            Showing {filteredTours.length}{" "}
            {filteredTours.length === 1 ? "tour" : "tours"}
            {filteredTours.length > 0 && (
              <span>
                {" "}
                • Page {currentPage} of {totalPages} • {totalTours} total tours
              </span>
            )}
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* Tours grid */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                  {filteredTours.map((tour) => (
                    <div
                      key={tour._id}
                      className="bg-white/5 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 h-full flex flex-col hover:bg-white/10 transition-colors cursor-pointer transform transition-transform duration-300 hover:-translate-y-2"
                      onClick={() => handleTourClick(tour)}>
                      <div className="relative w-full h-48">
                        <img
                          src={
                            tour.images[0] ||
                            "/placeholder.svg?height=400&width=600"
                          }
                          alt={tour.title}
                          fill
                          className="object-cover object-center w-full h-full"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-indigo-600">
                            {tour.category}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-5 flex-grow flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-white line-clamp-1">
                            {tour.title}
                          </h3>
                        </div>

                        <div className="flex items-center text-white/70 mb-2">
                          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{tour.location}</span>
                        </div>

                        <p className="text-white/80 text-sm mb-4 line-clamp-2">
                          {tour.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <div className="flex items-center bg-white/10 rounded-full px-3 py-1 text-xs text-white/90">
                            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                            {tour.duration} days
                          </div>
                          <div className="flex items-center bg-white/10 rounded-full px-3 py-1 text-xs text-white/90">
                            <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                            {getAvailableSlots(tour)} slots left
                          </div>
                          <div className="flex items-center bg-white/10 rounded-full px-3 py-1 text-sm text-white/90">
                            {tour.category}
                          </div>
                        </div>

                        <div className="mt-auto flex justify-between items-center">
                          <div className="text-xs text-white/70">
                            {formatDate(tour.startDate)}
                          </div>
                          <div className="text-xl font-bold text-white">
                            ₹{parseInt(tour.price).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredTours.map((tour) => (
                    <div
                      key={tour._id}
                      className="bg-white/5 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 flex flex-col md:flex-row hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => handleTourClick(tour)}>
                      <div className="md:w-1/3 h-48 relative">
                        <img
                          src={
                            tour.images[0] ||
                            "/placeholder.svg?height=400&width=600"
                          }
                          alt={tour.title}
                          fill
                          className="object-cover object-center w-full h-full"
                        />
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-white">
                            {tour.title}
                          </h3>
                          <div className="text-xl font-bold text-white">
                            ₹{parseInt(tour.price).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center text-white/70 mb-3">
                          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span>{tour.location}</span>
                        </div>

                        <p className="text-white/80 mb-4 line-clamp-3">
                          {tour.description}
                        </p>

                        <div className="flex flex-wrap gap-3 mb-4">
                          <div className="flex items-center bg-white/10 rounded-full px-3 py-1 text-sm text-white/90">
                            <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                            {tour.duration} days
                          </div>
                          <div className="flex items-center bg-white/10 rounded-full px-3 py-1 text-sm text-white/90">
                            <Users className="w-4 h-4 mr-1 flex-shrink-0" />
                            {getAvailableSlots(tour)} slots left
                          </div>
                          <div className="flex items-center bg-white/10 rounded-full px-3 py-1 text-sm text-white/90">
                            {tour.category}
                          </div>
                          <div className="flex items-center bg-white/10 rounded-full px-3 py-1 text-sm text-white/90">
                            {formatDate(tour.startDate)} -{" "}
                            {formatDate(tour.endDate)}
                          </div>
                        </div>

                        <div className="mt-auto flex justify-end">
                          <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* No results */}
          {!isLoading && filteredTours.length === 0 && (
            <div className="text-center py-16">
              <div className="text-white/50 text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                No tours found
              </h3>
              <p className="text-white/70 mb-6">
                Try adjusting your filters or search criteria
              </p>
              <Button
                onClick={resetAllFilters}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                Reset Filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredTours.length > 0 && (
            <div className="flex justify-center mt-12">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="text-white border-white/20 hover:bg-white/10"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="text-white/50 px-2">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={`page-${page}`}
                      className={
                        currentPage === page
                          ? "bg-white/20 hover:bg-white/30 text-white"
                          : "bg-transparent text-white hover:bg-white/10"
                      }
                      onClick={() => goToPage(page)}>
                      {page}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  className="text-white border-white/20 hover:bg-white/10"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Newsletter section */}
        <div className="container mx-auto px-4 py-16">
          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-indigo-500/20">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Stay Updated on New Adventures
              </h2>
              <p className="text-indigo-200 mb-8">
                Subscribe to our newsletter and be the first to know about
                exclusive deals and upcoming expeditions
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
                />
                <Button
                  disabled={subscribing}
                  onClick={handleSubscribe}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                  {subscribing ? "Subscribing..." : "Subscribe"}
                </Button>
              </div>
              {showConfirm && (
                <i className="text-green-500 mt-5">Thanks for Subscribing...</i>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
