const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Product = require('../models/Product');
const productsController = require('../controllers/productsController');
const { protect, requireRole, optionalAuth } = require('../middleware/auth');
const { validateProduct, validateMongoId, validateProductQuery } = require('../middleware/validation');

const router = express.Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'products');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const validMime = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const validExt = ALLOWED_EXTENSIONS.test(file.originalname);

    if (validMime && validExt) {
      cb(null, true);
      return;
    }

    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Seules les images JPG, PNG et WebP sont acceptées.'));
  },
});

const uploadSingle = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image trop lourde. Maximum 5 Mo.' });
      }
      return res.status(400).json({ message: err.message || 'Erreur upload.' });
    }
    if (err) return res.status(400).json({ message: err.message });
    return next();
  });
};

const deleteOldImage = (imagePath) => {
  if (!imagePath) return;
  const fullPath = path.join(__dirname, '..', imagePath);
  if (fs.existsSync(fullPath)) {
    fs.unlink(fullPath, (err) => {
      if (err) console.error('[Upload] Erreur suppression image:', err.message);
    });
  }
};

router.get('/', optionalAuth, validateProductQuery, productsController.listProducts);
router.get('/seller/me', protect, productsController.getMyProducts);
router.get('/:id', validateMongoId, productsController.getProductById);
router.post('/:id/clicks', validateMongoId, productsController.incrementClicks);
router.post('/', protect, requireRole('vendeur', 'admin'), uploadSingle, validateProduct, async (req, res) => {
  const response = await productsController.createProduct(req, res);
  if (res.statusCode >= 400 && req.file) {
    deleteOldImage(`/uploads/products/${req.file.filename}`);
  }
  return response;
});
router.put('/:id', protect, validateMongoId, uploadSingle, async (req, res) => {
  const previousProduct = await Product.findById(req.params.id).select('image').lean();
  const previousImage = previousProduct?.image;

  const response = await productsController.updateProduct(req, res);

  if (res.statusCode >= 400 && req.file) {
    deleteOldImage(`/uploads/products/${req.file.filename}`);
  } else if (req.file && previousImage) {
    deleteOldImage(previousImage);
  }

  return response;
});
router.delete('/:id', protect, validateMongoId, async (req, res) => {
  const previousProduct = await Product.findById(req.params.id).select('image').lean();
  const previousImage = previousProduct?.image;
  const response = await productsController.deleteProduct(req, res);
  if (res.statusCode < 400 && previousImage) {
    deleteOldImage(previousImage);
  }
  return response;
});

module.exports = router;
