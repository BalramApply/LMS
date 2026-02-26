const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|avi|mov|wmv|mkv/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (file.fieldname === 'thumbnail' || file.fieldname === 'avatar' || file.fieldname === 'image') {
    const isImage = allowedImageTypes.test(extname.slice(1)) && 
                    mimetype.startsWith('image/');
    
    if (isImage) {
      return cb(null, true);
    } else {
      cb(new Error('nly image files (jpeg, jpg, png, gif, webp) are allowed!'));
    }
  } else if (file.fieldname === 'video') {
    const isVideo = allowedVideoTypes.test(extname.slice(1)) && 
                    mimetype.startsWith('video/');
    
    if (isVideo) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  } else {
    cb(null, true);
  }
};

// Configure upload limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: fileFilter,
});

module.exports = upload;