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

router.post('/', protect, validateReview, reviewsController.createReview);
router.get('/product/:productId', [
  param('productId').isMongoId().withMessage('Identifiant produit invalide.'),
  validate,
], reviewsController.getProductReviews);
router.get('/seller/:sellerId', [
  param('sellerId').isMongoId().withMessage('Identifiant vendeur invalide.'),
  validate,
], reviewsController.getSellerReviews);
router.delete('/:id', protect, requireRole('admin'), [
  param('id').isMongoId().withMessage('Identifiant avis invalide.'),
  validate,
], reviewsController.deleteReview);

module.exports = router;
