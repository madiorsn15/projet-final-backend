const express = require('express');
const { body, param } = require('express-validator');
const { protect, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const reviewsController = require('../controllers/reviewsController');

const router = express.Router();

const validateReview = [
  body('productId')
    .notEmpty().withMessage('Le produit est requis.')
    .isMongoId().withMessage('Identifiant produit invalide.'),
  body('rating')
    .notEmpty().withMessage('La note est requise.')
    .isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5.'),
  body('comment')
    .trim()
    .notEmpty().withMessage('Le commentaire est requis.')
    .isLength({ min: 10, max: 500 }).withMessage('Le commentaire doit contenir entre 10 et 500 caractères.'),
  validate,
];

const validateMongoParam = (field) => [
  param(field).isMongoId().withMessage(`Identifiant ${field} invalide.`),
  validate,
];

// ✅ NOUVEAU : vérifier si l'utilisateur connecté peut noter ce produit
router.get('/can-review/:productId',
  protect,
  validateMongoParam('productId'),
  reviewsController.checkCanReview
);

router.post('/',
  protect,
  validateReview,
  reviewsController.createReview
);

router.get('/product/:productId',
  validateMongoParam('productId'),
  reviewsController.getProductReviews
);

router.get('/seller/:sellerId',
  validateMongoParam('sellerId'),
  reviewsController.getSellerReviews
);

// ✅ CORRIGÉ : l'auteur OU l'admin peut supprimer (la vérif est dans le controller)
router.delete('/:id',
  protect,
  validateMongoParam('id'),
  reviewsController.deleteReview
);

module.exports = router;