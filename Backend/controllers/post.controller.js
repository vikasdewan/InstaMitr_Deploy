import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { getRecieverSocketId, io } from "../socket/socket.js";

export const addNewImagePost = async (req, res) => {
  try {
    const { caption } = req.body;
    const images = req.files;
    const authorId = req.id;

    if (!images || images.length === 0) {
      return res.status(400).json({
        message: "At least one image is required.",
        success: false,
      });
    }

    if (images.length > 3) {
      return res.status(400).json({
        message: "You can upload a maximum of 3 images.",
        success: false,
      });
    }

    const imageUrls = [];

    for (const file of images) {
      const optimizedBuffer = await sharp(file.buffer)
        .resize({ width: 800, height: 800, fit: "inside" })
        .toFormat("jpeg", { quality: 80 })
        .toBuffer();

      const fileUri = `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`;

      const cloudRes = await cloudinary.uploader.upload(fileUri);
      imageUrls.push(cloudRes.secure_url);
    }

    const post = await Post.create({
      caption,
      images: imageUrls,
      author: authorId,
    });

    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    await post.populate({ path: "author", select: "-password" });

    return res.status(201).json({
      message: "New Post with multiple images added",
      post,
      success: true,
    });
  } catch (error) {
    console.log("Error adding new image post:", error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};
// Add video post
export const addNewVideoPost = async (req, res) => {
  try {
    const { caption } = req.body;
    
    const video = req.file;  // Extract the video from req.file
     
    const authorId = req.id;
 
    
    if (!video) {
      
      return res.status(400).json({
        message: "Video file is required.",
        status: false,
      });
    }
    
   
    // Upload video buffer to Cloudinary
    const cloudResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: "video", folder: "your_video_folder" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(video.buffer); // Send the buffer
    });

    
  
   
    
    // Create the post with the video URL
    const post = await Post.create({
      caption,
      video: cloudResponse.secure_url, // Store the Cloudinary URL for the video
      author: authorId,
    });
 
    console.log(post)

    // Optional: If you want to link the post to the user
    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id); // Add post to user's list of posts
      await user.save();
    }

    await post.populate({ path: "author", select: "-password" });

    return res.status(201).json({
      message: "New video post added successfully.",
      post,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error. Please try again later.",
      status: false,
    });
  }
};

export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profileImage" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username profileImage",
        },
      });

    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUserPost = async (req, res) => {
  try {
    const authorId = req.id;
    const posts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username, profileImage" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username,profileImage",
        },
      });

    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const likePost = async (req, res) => {
  try {
    const likeKrneWalaUserKiId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "post Not found",
        success: false,
      });
    }

    //like logic started

    //$addToSet use to not add things more than once , like a Set Data Structure
    await post.updateOne({ $addToSet: { likes: likeKrneWalaUserKiId } });

    await post.save();

    //implement socket io for real time notification
    const user = await User.findById(likeKrneWalaUserKiId).select('username profileImage')
    const postOwnerId = post.author.toString();

    if(postOwnerId !== likeKrneWalaUserKiId){
      //emit a notification event
      const notification = {
        type:'like',
        userId:likeKrneWalaUserKiId,
        userDetails:user,
        postId,
        message:'Your Post Was Liked'
      }

      const postOwnerSocketId = getRecieverSocketId(postOwnerId);
      io.to(postOwnerSocketId).emit('notification',notification);
    }

    return res.status(200).json({
      message: "Post Liked",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const dislikePost = async (req, res) => {
  try {
    const dislikeKrneWalaUserKiId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "post Not found",
        success: false,
      });
    }

    //dislike logic started

    //$addToSet use to not add things more than once , like a Set Data Structure
    await post.updateOne({ $pull: { likes: dislikeKrneWalaUserKiId } }); //remove that like using pull method

    await post.save();

    //implement socket io for real time notification
    const user = await User.findById(dislikeKrneWalaUserKiId).select('username profileImage')
    const postOwnerId = post.author.toString();

    if(postOwnerId !== dislikeKrneWalaUserKiId){
      //emit a notification event
      const notification = {
        type:'dislike',
        userId:dislikeKrneWalaUserKiId,
        userDetails:user,
        postId,
        message:'Your Post Was Liked'
      }

      const postOwnerSocketId = getRecieverSocketId(postOwnerId);
      io.to(postOwnerSocketId).emit('notification',notification);
    }

    return res.status(200).json({
      message: "Post DisLiked",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentKrneWalaUsrKiId = req.id;

    const { text } = req.body;
    const post = await Post.findById(postId);

    if (!text) {
      return res.status(400).json({
        message: "text is required",
        success: false,
      });
    }

    const comment = await Comment.create({
      text,
      author: commentKrneWalaUsrKiId,
      post: postId,
    })

    await comment.populate({
      path: "author",
      select: "username profileImage",
    });

    post.comments.push(comment._id);

    await post.save();

    return res.status(201).json({
      message: "comment Added",
      comment,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getCommentsOfPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username profileImage"
    );

    if (!comments)
      return res.status(404).json({
        message: "no comments are there for this post",
        success: true,
      });

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.log(error);
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "post not exist",
        success: false,
      });
    }

    //check that the logged in user is the owner/author of the post

    if (post.author.toString() !== authorId) {
      return res.status(403).json({
        message: "not access to delete the post / unauthorised",
        success: false,
      });
    }

    //delete post

    await Post.findByIdAndDelete(postId);

    //remove the post id from the user's posts
    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString() !== postId);
    await user.save();

    //delete associated comments
    await Comment.deleteMany({ post: postId });

    return res.status(200).json({
      message: "post Deleted",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);

    if (!post)
      return res.status(404).json({
        message: "post Not found",
        success: false,
      });

    const user = await User.findById(authorId);

    if (user.bookmarks.includes(post._id)) {
      //already bookmarked , then we have to unbookmark the post
      await user.updateOne({ $pull: { bookmarks: post._id } });
      await user.save();
      return res.status(200).json({
        type: "unsaved",
        message: "post removed from book mark",
        success: true,
      });
    } else {
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      await user.save();
      return res.status(200).json({
        type: "saved",
        message: "post bookmarked",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
  }
};
