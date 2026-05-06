const multer = require('multer');
const path = require('path');

// Configure how and where to store the files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // Extract user_id from headers (passed by AuthMiddleware)
        const userId = req.headers['user_id'] || "anonymous";
        const fileExt = path.extname(file.originalname);
        const fileName = `${userId}-${Date.now()}${fileExt}`;
        cb(null, fileName);
    }
});

// Filter to ensure only images are uploaded
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Initialize multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

module.exports = upload;