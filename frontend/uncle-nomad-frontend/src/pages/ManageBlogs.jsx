import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
  Upload,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AnimatedSection from "../components/AnimatedSection";

// Add a date formatting utility function at the top
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const ManageBlogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [newBlog, setNewBlog] = useState({
    title: "",
    author: "Uncle Nomad",
    content: [{ type: "text", content: "" }],
    status: "draft",
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadingImages, setUploadingImages] = useState({});
  const [expandedBlog, setExpandedBlog] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/blogs`,
        {
          headers: { "x-api-key": process.env.REACT_APP_API_KEY },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch blogs");
      const data = await response.json();
      setBlogs(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = (type) => {
    const newSection = {
      type,
      ...(type === "text"
        ? { content: "" }
        : { imageUrl: "", imageAlt: "", file: null }),
    };

    if (isAddingNew) {
      setNewBlog((prev) => ({
        ...prev,
        content: [...prev.content, newSection],
      }));
    } else if (editingBlog) {
      setEditingBlog((prev) => ({
        ...prev,
        content: [...prev.content, newSection],
      }));
    }
  };

  const handleSectionChange = (index, field, value) => {
    if (isAddingNew) {
      setNewBlog((prev) => ({
        ...prev,
        content: prev.content.map((section, i) =>
          i === index ? { ...section, [field]: value } : section
        ),
      }));
    } else if (editingBlog) {
      setEditingBlog((prev) => ({
        ...prev,
        content: prev.content.map((section, i) =>
          i === index ? { ...section, [field]: value } : section
        ),
      }));
    }
  };

  const handleRemoveSection = (index) => {
    if (isAddingNew) {
      setNewBlog((prev) => ({
        ...prev,
        content: prev.content.filter((_, i) => i !== index),
      }));
    } else if (editingBlog) {
      setEditingBlog((prev) => ({
        ...prev,
        content: prev.content.filter((_, i) => i !== index),
      }));
    }
  };

  const handleImageSelect = async (file, index) => {
    if (!file) return;

    // Create a local preview URL
    const previewUrl = URL.createObjectURL(file);

    // Store the file for later upload
    handleSectionChange(index, "file", file);
    handleSectionChange(index, "imageUrl", previewUrl);

    // Set a default alt text if none exists
    const currentContent = isAddingNew
      ? newBlog.content[index]
      : editingBlog.content[index];

    if (!currentContent.imageAlt) {
      handleSectionChange(index, "imageAlt", file.name || "Blog image");
    }
  };

  const uploadImageToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/blogs/upload`,
        {
          method: "POST",
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Failed to upload image");
      const data = await response.json();

      // Return both URL and publicId
      return {
        imageUrl: data.url,
        publicId: data.publicId,
      };
    } catch (err) {
      console.error("Error uploading image:", err);
      throw err;
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const blogData = isAddingNew ? newBlog : editingBlog;

      // Check if required fields are filled
      if (!blogData.title.trim()) {
        alert("Please provide a title for the blog");
        setIsSaving(false);
        return;
      }

      // Upload all images to Cloudinary first
      const updatedContent = await Promise.all(
        blogData.content.map(async (section) => {
          if (section.type === "image" && section.file) {
            setUploadingImages((prev) => ({
              ...prev,
              [section.imageUrl]: true,
            }));
            try {
              const cloudinaryData = await uploadImageToCloudinary(
                section.file
              );
              setUploadingImages((prev) => ({
                ...prev,
                [section.imageUrl]: false,
              }));
              // Return a clean object without the file property
              return {
                type: section.type,
                imageUrl: cloudinaryData.imageUrl,
                imageAlt: section.imageAlt || "",
                publicId: cloudinaryData.publicId,
              };
            } catch (err) {
              setUploadingImages((prev) => ({
                ...prev,
                [section.imageUrl]: false,
              }));
              throw err;
            }
          } else if (section.type === "image") {
            // For existing images, keep them but ensure no file property
            return {
              type: section.type,
              imageUrl: section.imageUrl,
              imageAlt: section.imageAlt || "",
              publicId: section.publicId,
            };
          } else {
            // For text sections
            return {
              type: "text",
              content: section.content || "",
            };
          }
        })
      );

      // Create a clean blog object without any file references
      const finalBlogData = {
        title: blogData.title,
        author: blogData.author,
        content: updatedContent,
        status: blogData.status,
        date: blogData.date || new Date().toISOString(), // Keep ISO format for storage
      };

      // If editing, include the _id
      if (!isAddingNew && editingBlog._id) {
        finalBlogData._id = editingBlog._id;
      }

      console.log("Sending blog data to server:", finalBlogData);

      const url = isAddingNew
        ? `${process.env.REACT_APP_API_URL}/api/blogs`
        : `${process.env.REACT_APP_API_URL}/api/blogs/${editingBlog._id}`;
      const method = isAddingNew ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
        },
        body: JSON.stringify(finalBlogData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error("Failed to save blog");
      }

      await fetchBlogs();
      setIsAddingNew(false);
      setEditingBlog(null);
      setNewBlog({
        title: "",
        author: "Uncle Nomad",
        content: [{ type: "text", content: "" }],
        status: "draft",
      });
      setUploadingImages({});
    } catch (err) {
      console.error("Error saving blog:", err);
      alert("Failed to save blog: " + err.message);
    } finally {
      setIsSaving(false);
      setUploadingImages({});
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/blogs/${id}`,
        {
          method: "DELETE",
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete blog");
      await fetchBlogs();
    } catch (err) {
      console.error("Error deleting blog:", err);
      alert("Failed to delete blog");
    }
  };

  // Helper function to check if any uploads are in progress
  const isUploadInProgress = () => {
    return Object.values(uploadingImages).some((status) => status === true);
  };

  // Helper function to check if form is valid (at minimum requires a title)
  const isFormValid = () => {
    const blogData = isAddingNew ? newBlog : editingBlog;
    return blogData && blogData.title && blogData.title.trim() !== "";
  };

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

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Blogs</h2>

      <div className="flex justify-between items-center mb-8">
        <div></div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5" />
          Add New Blog
        </button>
      </div>

      {/* Blog Form */}
      {(isAddingNew || editingBlog) && (
        <AnimatedSection
          animation="slide-up"
          duration={800}
          className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {isAddingNew ? "Add New Blog" : "Edit Blog"}
            </h2>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setEditingBlog(null);
                setNewBlog({
                  title: "",
                  author: "Uncle Nomad",
                  content: [{ type: "text", content: "" }],
                  status: "draft",
                });
              }}
              className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={isAddingNew ? newBlog.title : editingBlog.title}
                onChange={(e) =>
                  isAddingNew
                    ? setNewBlog({ ...newBlog, title: e.target.value })
                    : setEditingBlog({
                        ...editingBlog,
                        title: e.target.value,
                      })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author
              </label>
              <input
                type="text"
                value={isAddingNew ? newBlog.author : editingBlog.author}
                onChange={(e) =>
                  isAddingNew
                    ? setNewBlog({ ...newBlog, author: e.target.value })
                    : setEditingBlog({
                        ...editingBlog,
                        author: e.target.value,
                      })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={isAddingNew ? newBlog.status : editingBlog.status}
                onChange={(e) =>
                  isAddingNew
                    ? setNewBlog({ ...newBlog, status: e.target.value })
                    : setEditingBlog({
                        ...editingBlog,
                        status: e.target.value,
                      })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Sections
              </label>
              <div className="space-y-4">
                {(isAddingNew ? newBlog.content : editingBlog.content).map(
                  (section, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-gray-900">
                          {section.type === "text"
                            ? "Text Section"
                            : "Image Section"}
                        </h3>
                        <button
                          onClick={() => handleRemoveSection(index)}
                          className="text-red-500 hover:text-red-700">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {section.type === "text" ? (
                        <textarea
                          value={section.content}
                          onChange={(e) =>
                            handleSectionChange(
                              index,
                              "content",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          rows="4"
                        />
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageSelect(e.target.files[0], index)
                              }
                              className="hidden"
                              id={`image-upload-${index}`}
                            />
                            <label
                              htmlFor={`image-upload-${index}`}
                              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                              <Upload className="w-5 h-5" />
                              Upload Image
                            </label>
                            <input
                              type="text"
                              placeholder="Image Alt Text"
                              value={section.imageAlt}
                              onChange={(e) =>
                                handleSectionChange(
                                  index,
                                  "imageAlt",
                                  e.target.value
                                )
                              }
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          {section.imageUrl && (
                            <div className="relative aspect-video rounded-lg overflow-hidden">
                              {uploadingImages[section.imageUrl] ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                </div>
                              ) : (
                                <img
                                  src={section.imageUrl}
                                  alt={section.imageAlt || "Blog image"}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleAddSection("text")}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                  <Plus className="w-5 h-5" />
                  Add Text Section
                </button>
                <button
                  onClick={() => handleAddSection("image")}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                  <ImageIcon className="w-5 h-5" />
                  Add Image Section
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingBlog(null);
                  setNewBlog({
                    title: "",
                    author: "Uncle Nomad",
                    content: [{ type: "text", content: "" }],
                    status: "draft",
                  });
                }}
                disabled={isSaving || isUploadInProgress()}
                className={`px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors ${
                  isSaving || isUploadInProgress()
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isUploadInProgress() || !isFormValid()}
                className={`flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors ${
                  isSaving || isUploadInProgress() || !isFormValid()
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Blog
                  </>
                )}
              </button>
            </div>

            {isUploadInProgress() && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg flex items-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Uploading images... Please wait before saving.</span>
              </div>
            )}
          </div>
        </AnimatedSection>
      )}

      {/* Blogs List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sections
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {blogs.map((blog) => (
                <React.Fragment key={blog._id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setExpandedBlog(
                              expandedBlog === blog._id ? null : blog._id
                            )
                          }
                          className="text-gray-400 hover:text-gray-600">
                          {expandedBlog === blog._id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {blog.title}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate overflow-hidden">
                            {blog.content[0]?.type === "text"
                              ? blog.content[0].content
                              : "Image content"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{blog.author}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(blog.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          blog.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {blog.content.length} sections
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingBlog(blog)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                          title="Edit Blog">
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete Blog">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedBlog === blog._id && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          {blog.content.map((section, index) => (
                            <div
                              key={index}
                              className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {section.type === "text"
                                    ? "Text Section"
                                    : "Image Section"}
                                </span>
                                {section.type === "image" && (
                                  <span className="text-xs text-gray-500">
                                    {section.imageAlt}
                                  </span>
                                )}
                              </div>
                              {section.type === "text" ? (
                                <p className="text-gray-600 whitespace-pre-wrap">
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {blogs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <ImageIcon className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No blogs found
          </h3>
          <p className="text-gray-500">
            Get started by creating your first blog post.
          </p>
        </div>
      )}
    </div>
  );
};

export default ManageBlogs;
