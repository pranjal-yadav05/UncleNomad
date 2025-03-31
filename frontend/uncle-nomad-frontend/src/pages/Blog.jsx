import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronRight, Menu } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MouseTracker from "../components/MouseTracker";
import ScrollProgress from "../components/ScrollProgress";
import AnimatedSection from "../components/AnimatedSection";

// Add date formatting utility function
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const Blog = () => {
  const navigate = useNavigate();
  const [activeBlog, setActiveBlog] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/blogs?status=published`,
          {
            headers: { "x-api-key": process.env.REACT_APP_API_KEY },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch blogs");
        }
        const data = await response.json();
        setBlogs(data);
        if (data.length > 0) {
          setActiveBlog(data[0]._id);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching blogs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const scrollToBlog = (blogId) => {
    setActiveBlog(blogId);
  };

  const currentBlog = blogs.find((blog) => blog._id === activeBlog);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl mb-4">Error loading blogs</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="min-h-screen relative">
        <ScrollProgress color="#6366f1" height={4} showPercentage={true} />
        <div className="bg-gray-50">
          <Header />
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 -z-10"></div>
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-900/80 to-transparent -z-10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
          <div className="flex">
            <div className="flex-1 py-12">
              <div className="container mx-auto px-4">
                <div className="flex text-white items-center justify-between mb-8">
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                  </motion.button>
                </div>

                <AnimatedSection
                  animation="slide-up"
                  duration={1200}
                  intensity={1.2}>
                  <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Travel Stories
                  </h1>
                </AnimatedSection>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-white/60" />
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    No Blogs Available
                  </h2>
                  <p className="text-white/80">
                    We're working on creating amazing travel stories for you.
                    Check back soon!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <MouseTracker
      enabled={true}
      effectOpacity={0.2}
      effectBlur={80}
      effectColor="rgba(65, 105, 225, 0.15)">
      <div className="min-h-screen relative">
        <ScrollProgress color="#6366f1" height={4} showPercentage={true} />
        <div className="bg-gray-50">
          <Header />
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 -z-10"></div>
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-900/80 to-transparent -z-10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
          <div className="flex">
            {/* Main Content */}
            <div className="flex-1 py-12">
              <div className="container mx-auto px-4">
                <div className="flex text-white items-center justify-between mb-8">
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                  </motion.button>
                </div>

                <AnimatedSection
                  animation="slide-up"
                  duration={1200}
                  intensity={1.2}>
                  <h1
                    className="text-4xl md:text-5xl text-center font-extrabold text-white mb-3"
                    style={{ fontFamily: "Josefin Sans" }}>
                    Travel Stories
                  </h1>
                </AnimatedSection>

                {/* Improved Tab Navigation for better mobile experience */}
                <div className="flex justify-center mb-8">
                  <div className="w-full overflow-x-auto py-2 no-scrollbar">
                    <div className="flex gap-2 min-w-max mx-auto">
                      {blogs.map((blog) => (
                        <button
                          key={blog._id}
                          onClick={() => scrollToBlog(blog._id)}
                          className={`px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                            activeBlog === blog._id
                              ? "bg-white text-gray-900 shadow-lg"
                              : "text-white hover:bg-white/10"
                          }`}>
                          {blog.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Single Blog Post */}
                {currentBlog && (
                  <AnimatedSection
                    animation="slide-up"
                    duration={800}
                    className="relative z-30">
                    <motion.article
                      key={currentBlog._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                      <div className="p-8">
                        <h2 className="text-3xl font-bold mb-4 text-gray-900">
                          {currentBlog.title}
                        </h2>
                        <div className="flex items-center gap-4 text-gray-600 mb-6">
                          <span>{formatDate(currentBlog.date)}</span>
                          <span>•</span>
                          <span>By {currentBlog.author}</span>
                        </div>

                        <div className="prose prose-lg max-w-none">
                          {currentBlog.content.map((section, index) => (
                            <div key={index} className="mb-6">
                              {section.type === "text" ? (
                                <p className="text-gray-700 leading-relaxed">
                                  {section.content}
                                </p>
                              ) : (
                                <div className="relative aspect-video rounded-lg overflow-hidden">
                                  <img
                                    src={section.imageUrl}
                                    alt={section.imageAlt || "Blog image"}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.article>
                  </AnimatedSection>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </MouseTracker>
  );
};

// Add this at the end of the file
// CSS for hiding scrollbars but maintaining scroll functionality
const scrollbarStyles = `
<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
`;

document.head.insertAdjacentHTML("beforeend", scrollbarStyles);

export default Blog;
