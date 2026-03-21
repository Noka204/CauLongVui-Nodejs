const multer = require('multer');
const path = require('path');
const { BadRequestError } = require('../exceptions/BadRequestError');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/temp';
    if (file.fieldname === 'images' || file.fieldname === 'imagesUrl') folder = 'uploads/images';
    if (file.fieldname === 'avatar') folder = 'uploads/avatars';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Strict check on actual extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.png', '.jpg', '.jpeg', '.webp'];

  if (file.mimetype.startsWith('image/') && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only valid image files (png, jpg, jpeg, webp) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
