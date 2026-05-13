const express = require('express');
const { body } = require('express-validator');
const usersController = require('../controllers/usersController');
const { protect, requireRole } = require('../middleware/auth');
const { validate, validateMongoId } = require('../middleware/validation');

const router = express.Router();

router.get('/profile', protect, usersController.getProfile);
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères.')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Nom invalide.'),
  body('whatsapp')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-().]{7,20}$/).withMessage('Numéro WhatsApp invalide.'),
  body('role').not().exists().withMessage('Le rôle ne peut pas être modifié ici.'),
  body('email').not().exists().withMessage('L\'email ne peut pas être modifié ici.'),
  validate,
], usersController.updateProfile);
router.get('/seller/:id', validateMongoId, usersController.getSellerPublicProfile);
router.get('/favorites', protect, usersController.getFavorites);
router.post('/favorites/:productId', protect, usersController.addFavorite);
router.delete('/favorites/:productId', protect, usersController.removeFavorite);
router.get('/', protect, requireRole('admin'), usersController.getAllUsers);
router.patch('/:id/toggle', protect, requireRole('admin'), validateMongoId, usersController.toggleUserStatus);
router.delete('/:id', protect, requireRole('admin'), validateMongoId, usersController.deleteUser);

module.exports = router;
