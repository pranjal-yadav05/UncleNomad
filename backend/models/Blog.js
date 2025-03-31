import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    author: {
      type: String,
      default: "Uncle Nomad",
      trim: true,
    },
    content: [
      {
        type: {
          type: String,
          enum: ["text", "image"],
          required: true,
        },
        content: {
          type: String,
          required: function () {
            return this.type === "text";
          },
        },
        imageUrl: {
          type: String,
          required: function () {
            return this.type === "image";
          },
        },
        imageAlt: {
          type: String,
          required: false,
          default: "",
        },
        publicId: {
          type: String,
          required: false,
        },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
