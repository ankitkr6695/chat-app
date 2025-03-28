const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat_uploads", // Cloudinary folder
    allowed_formats: ["jpg", "png", "jpeg", "gif", "pdf", "docx", "mp4"], // File types
  },
});

const upload = multer({ storage });

module.exports = { upload, cloudinary };
