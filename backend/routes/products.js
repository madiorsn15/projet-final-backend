const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { fileTypeFromBuffer } = require('file-type'); // npm install file-type@16
const Product = require('../models/Product');
const productsController = require('../controllers/productsController');
const { protect, requireRole, optionalAuth } = require('../middleware/auth');
const { validateProduct, validateMongoId, validateProductQuery } = require('../middleware/validation');

const router = express.Router();

// ✅ Whitelist stricte
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// ✅ Magic bytes réels (signatures de fichiers)
const MAGIC_BYTES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png':  [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF....WEBP
};

const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads', 'products');

// ✅ Vérification magic bytes — lit les vrais premiers octets du fichier
const verifyMagicBytes = async (filePath, expectedMime) => {
  const buffer = Buffer.alloc(12);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 12, 0);
  fs.closeSync(fd);

  // Utilise file-type pour détecter le vrai type
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
    return false;
  }
  // Pour WebP : vérifie aussi la signature RIFF + WEBP
  if (detected.mime === 'image/webp') {
    const str = buffer.toString('ascii', 8, 12);
    if (str !== 'WEBP') return false;
  }
  return true;
};

// ✅ Stockage temporaire d'abord — vérification après
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // ✅ Extension depuis MIME type (pas depuis originalname — non trustable)
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/png':  '.png',
      'image/webp': '.webp',
    };
    const ext = mimeToExt[file.mimetype] || '.jpg';
    cb(null, `${uuidv4()}${ext}`); // filename 100% aléatoire
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Mo
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // ✅ Vérification 1 : MIME type (côté client — première barrière)
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        'Type de fichier non autorisé. Seuls JPG, PNG et WebP sont acceptés.'
      ));
    }
    // ✅ Vérification 2 : extension du nom original
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        'Extension non autorisée.'
      ));
    }
    cb(null, true);
  },
});

// ✅ Middleware upload avec vérification magic bytes APRÈS écriture sur disque
const uploadSingle = (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image trop lourde. Maximum 5 Mo.' });
      }
      return res.status(400).json({ message: err.message || 'Erreur upload.' });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    // ✅ Vérification 3 : magic bytes (vrai type binaire du fichier)
    if (req.file) {
      try {
        const isValid = await verifyMagicBytes(req.file.path, req.file.mimetype);
        if (!isValid) {
          // Supprime immédiatement le fichier suspect
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            message: 'Fichier invalide. Le contenu ne correspond pas à une image autorisée.',
          });
        }
      } catch (e) {
        // En cas d'erreur de lecture, supprime par sécurité
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({ message: 'Erreur lors de la vérification du fichier.' });
      }
    }

    return next();
  });
};

// ✅ Suppression sécurisée — path traversal impossible
const deleteOldImage = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return;

  // Résout le chemin absolu et vérifie qu'il est bien dans UPLOADS_DIR
  const fullPath = path.resolve(__dirname, '..', imagePath);
  if (!fullPath.startsWith(UPLOADS_DIR)) {
    console.warn(`[Upload] Tentative de path traversal bloquée : ${imagePath}`);
    return;
  }
  if (fs.existsSync(fullPath)) {
    fs.unlink(fullPath, (err) => {
      if (err) console.error('[Upload] Erreur suppression image:', err.message);
    });
  }
};

// ✅ Middleware ownership — vérifie que le produit appartient au vendeur
const checkProductOwnership = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).select('seller').lean();
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }
    // Admin peut tout faire
    if (req.user.role === 'admin') return next();
    // Vendeur : doit être le propriétaire
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé. Ce produit ne vous appartient pas.' });
    }
    return next();
  } catch (e) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── ROUTES ──────────────────────────────────────────────────────────────────

router.get('/',           optionalAuth, validateProductQuery, productsController.listProducts);
router.get('/seller/me',  protect,                            productsController.getMyProducts);
router.get('/:id',        validateMongoId,                    productsController.getProductById);
router.post('/:id/clicks',validateMongoId,                    productsController.incrementClicks);

router.post('/',
  protect,
  requireRole('vendeur', 'admin'),
  uploadSingle,
  validateProduct,
  async (req, res) => {
    const response = await productsController.createProduct(req, res);
    if (res.statusCode >= 400 && req.file) {
      deleteOldImage(`/uploads/products/${req.file.filename}`);
    }
    return response;
  }
);

router.put('/:id',
  protect,
  validateMongoId,
  checkProductOwnership, // ✅ vérifie ownership avant upload
  uploadSingle,
  async (req, res) => {
    const previousProduct = await Product.findById(req.params.id).select('image').lean();
    const previousImage = previousProduct?.image;
    const response = await productsController.updateProduct(req, res);
    if (res.statusCode >= 400 && req.file) {
      deleteOldImage(`/uploads/products/${req.file.filename}`);
    } else if (req.file && previousImage) {
      deleteOldImage(previousImage);
    }
    return response;
  }
);

router.delete('/:id',
  protect,
  validateMongoId,
  checkProductOwnership, // ✅ vérifie ownership avant suppression
  async (req, res) => {
    const previousProduct = await Product.findById(req.params.id).select('image').lean();
    const previousImage = previousProduct?.image;
    const response = await productsController.deleteProduct(req, res);
    if (res.statusCode < 400 && previousImage) {
      deleteOldImage(previousImage);
    }
    return response;
  }
);

module.exports = router;