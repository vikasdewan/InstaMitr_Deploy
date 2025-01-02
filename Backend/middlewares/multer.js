import multer from "multer";

// Memory storage is used to keep files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Accept both image and video files
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error("Only image and video files are allowed."), false); // Reject other files
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // Limit file size to 50MB (adjust as needed)
  }
});

export default upload;
