const express = require("express");
const { upload } = require("../config/cloudnary");
const router = express.Router();

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  res.json({ url: req.file.path }); // Cloudinary URL
});

module.exports = router;
