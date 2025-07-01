import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  caption: {
    type: String,
    default: "",
  },

  // Support for multiple images (up to 3)
  images: {
    type: [String], // Array of image URLs
    validate: {
      validator: function (value) {
        return value.length <= 3;
      },
      message: "You can upload a maximum of 3 images.",
    },
    default: [],
  },

  // Optional: Still support video (if any)
  video: {
    type: String,
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
},
{
  timestamps: true
});

export const Post = mongoose.model("Post", postSchema);
